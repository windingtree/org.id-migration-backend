import express from 'express';
import http from 'http';
import helmet from 'helmet';
import cors from 'cors';
import { Service } from 'typedi';
import { PORT, ALLOWED_ORIGINS } from './config';

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

    // Routes setup
    this.setup();
  }

  private setup(): void {
    // Ping-pong endpoint
    this.app.get('/test', (_, res) => {
      res.status(200).send({
        status: 'OK',
      });
    });
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
