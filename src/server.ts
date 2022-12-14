import http from 'http';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { Service } from 'typedi';
import swaggerUI from 'swagger-ui-express';
import openApiValidator from 'express-openapi-validator';
import {
  ApiOwnerParams,
  ApiDidParams,
  ApiRequestParams,
  MigrationRequest,
  RequestStatus,
  Health,
} from './types';
import { NODE_ENV, PORT, ALLOWED_ORIGINS, SWAGGER_DOC } from './config';
import { ApiError, errorMiddleware } from './errors';
import { asyncHandler, expressLogger } from './utils';
import Logger from './logger';

// APIs
import { getHealthReport } from './api/health';
import { getOwned } from './api/orgid';
import {
  clean,
  addJob,
  getRequestByDid,
  getJobStatus,
  handleJobs,
} from './api/request';

const logger = Logger('server');

@Service()
export class Server {
  protected server: http.Server;
  protected app: express.Application;

  constructor() {
    this.app = express();

    // CORS setup
    const corsOptions = {
      origin: ALLOWED_ORIGINS,
      optionsSuccessStatus: 200,
      methods: 'GET,PUT,POST,DELETE,PATCH,OPTIONS',
      allowedHeaders:
        'Origin,X-Requested-With,Content-Type,Accept,Authorization',
      exposedHeaders: 'Content-Range,X-Content-Range',
      credentials: true,
    };
    this.app.use(cors(corsOptions));

    // Helmet setup
    this.app.set('trust proxy', 1);
    this.app.disable('x-powered-by');
    this.app.use(helmet());
    this.app.use(helmet.contentSecurityPolicy());
    this.app.use(helmet.crossOriginEmbedderPolicy());
    this.app.use(helmet.crossOriginOpenerPolicy());
    this.app.use(helmet.crossOriginResourcePolicy());
    this.app.use(helmet.dnsPrefetchControl());
    this.app.use(helmet.expectCt());
    this.app.use(helmet.frameguard());
    this.app.use(helmet.hidePoweredBy());
    this.app.use(helmet.hsts());
    this.app.use(helmet.ieNoOpen());
    this.app.use(helmet.noSniff());
    this.app.use(helmet.originAgentCluster());
    this.app.use(helmet.permittedCrossDomainPolicies());
    this.app.use(helmet.referrerPolicy());
    this.app.use(helmet.xssFilter());

    // Enable logger
    this.app.use(expressLogger);

    // API docs server
    this.app.use('/docs', swaggerUI.serve, swaggerUI.setup(SWAGGER_DOC));

    // Body-parsers middleware
    this.app.use(express.json());

    // Requests and responses validator middleware
    this.app.use(
      openApiValidator.middleware({
        apiSpec: SWAGGER_DOC,
        validateResponses: true,
      })
    );

    // Process jobs
    handleJobs();

    // Routes setup
    this.setup();

    // Handle errors
    this.app.use(errorMiddleware);
  }

  private setup(): void {
    // Health endpoint
    this.app.get(
      '/api/health',
      asyncHandler<unknown, unknown, unknown, Health>(async (_, res) => {
        const report = await getHealthReport();
        res.status(200).json(report);
      })
    );

    // System reset
    this.app.post(
      '/api/clean',
      asyncHandler(async (_req, res) => {
        if (NODE_ENV !== 'development') {
          throw new ApiError(405, 'Not Allowed');
        }
        await clean();
        res.status(200).send();
      })
    );

    // Owned ORGiDs
    this.app.get(
      '/api/owner/:address',
      asyncHandler<ApiOwnerParams>(async (req, res) => {
        const { address } = req.params;
        const orgIds = await getOwned(address);
        res.status(200).json(orgIds);
      })
    );

    // Migration requests
    this.app.post(
      '/api/request',
      asyncHandler<unknown, MigrationRequest, unknown, RequestStatus>(
        async (req, res) => {
          const status = await addJob(req.body);
          res.status(200).json(status);
        }
      )
    );

    // Request status by Id
    this.app.get(
      '/api/request/:id',
      asyncHandler<ApiRequestParams, unknown, unknown, RequestStatus>(
        async (req, res) => {
          const { id } = req.params;
          const status = await getJobStatus(id);
          res.status(200).json(status);
        }
      )
    );

    // Request status by DID
    this.app.get(
      '/api/did',
      asyncHandler<unknown, unknown, ApiDidParams, RequestStatus>(
        async (req, res) => {
          const { did } = req.query;
          const status = await getRequestByDid(did);
          res.status(200).json(status);
        }
      )
    );
  }

  async start(): Promise<http.Server> {
    return await new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(PORT, () => {
          logger.info(`Server listening on port ${PORT}`);
          resolve(this.server);
        });
      } catch (error) {
        logger.error(error);
        reject(error);
      }
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server.once('close', resolve);
        this.server.close();
      } catch (error) {
        logger.error(error);
        reject(error);
      }
    });
  }
}
