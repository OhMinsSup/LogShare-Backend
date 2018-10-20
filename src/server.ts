import * as Koa from 'koa';
import * as koaBody from 'koa-body';
import * as compress from 'koa-compress';
import * as cors from 'koa-cors';
import * as mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import routes from './routes';
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

    app.use(
      koaBody({
        multipart: true,
        formidable: {
          keepExtensions: true,
        },
      })
    );
    app.use(cors());
    app.use(
      compress({
        filter: contentType => {
          return /text/i.test(contentType);
        },
        threshold: 2048,
        flush: require('zlib').Z_SYNC_FLUSH,
      })
    );
  }

  private initializeDb(): void {
    const { MONGO_URL_WEB } = process.env;
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
