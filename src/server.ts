import http from 'http';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { Service } from 'typedi';
import swaggerUI from 'swagger-ui-express';
import openApiValidator from 'express-openapi-validator';
import { DateTime } from 'luxon';
import { errorMiddleware, asyncHandler } from './errors';
import { PORT, ALLOWED_ORIGINS, SWAGGER_DOC } from './config';
import { getOwned } from './api/orgid';

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

    // API docs server
    this.app.use('/docs', swaggerUI.serve, swaggerUI.setup(SWAGGER_DOC));

    // Requests and responses validator middleware
    this.app.use(
      openApiValidator.middleware({
        apiSpec: SWAGGER_DOC,
        validateResponses: true,
      })
    );

    // Routes setup
    this.setup();

    // Handle errors
    this.app.use(errorMiddleware);
  }

  private setup(): void {
    // Ping-pong endpoint
    this.app.get('/api/ping', (_, res) => {
      res.status(200).json({
        time: DateTime.now().toISO(),
      });
    });

    // Owned ORGiDs
    this.app.get(
      '/api/owner/:address',
      asyncHandler(async (req, res) => {
        const { address } = req.params;
        const orgIds = await getOwned(address);
        res.status(200).json(orgIds);
      })
    );
  }

  async start(): Promise<http.Server> {
    return await new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(PORT, () => {
          console.log(`Server listening on port ${PORT}`);
          resolve(this.server);
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server.once('close', resolve);
        this.server.close();
      } catch (e) {
        reject(e);
      }
    });
  }
}
