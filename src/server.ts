import * as Koa from 'koa';
import * as koaBody from 'koa-body';
import * as compress from 'koa-compress';
import * as cors from 'koa-cors';
import * as helmet from 'koa-helmet';
import * as mongoose from 'mongoose';
import * as session from 'koa-session';
import * as dotenv from 'dotenv';
import * as serve from "koa-static";
import * as path from 'path';
import routes from './routes';
import corsMiddleware from './lib/middleware/corsMiddleware';
import tokenMiddleware from './lib/middleware/tokenMiddleware';
dotenv.config();

class Server {
  public app: Koa;

  constructor() {
    this.app = new Koa();
    this.initializeDb();
    this.middleware();
    this.routes();
  }

  private middleware(): void {
    const { app } = this;

    app.keys = ['social_token'];

    app.use(
      koaBody({
        multipart: true,
        formidable: {
          keepExtensions: true,
        },
      })
    );
    app.use(session(app));
    app.use(helmet());
    app.use(cors());
    app.use(corsMiddleware);
    app.use(tokenMiddleware);
    app.use(
      compress({
        filter: contentType => {
          return /text/i.test(contentType);
        },
        threshold: 2048,
        flush: require('zlib').Z_SYNC_FLUSH,
      })
    );
    app.use(serve(path.join(__dirname, "../../frontend/build")))
  }

  private initializeDb(): void {
    const { MONGO_URL_WEB } = process.env;

    if (!MONGO_URL_WEB) return null;

    const MONGO_URL: string = MONGO_URL_WEB;
    (<any>mongoose).Promise = global.Promise;
    mongoose
      .connect(
        MONGO_URL,
        { useNewUrlParser: true }
      )
      .then(() => {
        console.log('connected to mongoDB ✅');
      })
      .catch(e => {
        console.log(
          'MongoDB connection error. Please make sure MongoDB is running. ' + e
        );
      });
  }

  private routes(): void {
    const { app } = this;
    app.use(routes.routes()).use(routes.allowedMethods());
  }
}

export default new Server().app;
