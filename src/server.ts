import * as Koa from 'koa';
import * as koaBody from 'koa-body';
// import * as compress from 'koa-compress';
import * as helmet from 'koa-helmet';
import * as mongoose from 'mongoose';
import * as session from 'koa-session';
import * as dotenv from 'dotenv';
import routes from './routes';
import corsMiddleware from './lib/middleware/corsMiddleware';
import tokenMiddleware from './lib/middleware/tokenMiddleware';
import redisClient from './lib/redisClient';
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

    app.proxy = true;
    app.keys = ['social_token'];
    app.use(session(app));
    app.use(corsMiddleware);
    app.use(tokenMiddleware);
    /*
    app.use(
      compress({
        filter: contentType => {
          return /text/i.test(contentType);
        },
        threshold: 2048,
        flush: require('zlib').Z_SYNC_FLUSH,
      })
    );
    */
    app.use(
      koaBody({
        multipart: true,
      })
    );
    app.use(helmet());
  }

  private initializeDb(): void {
    const URL =
      process.env.NODE_ENV === 'development'
        ? process.env.MONGODB_DEV_URI
        : process.env.MONGODB_URI;

    if (!URL) {
      const error = new Error('InvalidMogoUrlError');
      error.message = 'MONGODB_CONNECT_URI is missing.';
      throw error;
    }

    mongoose
      .connect(URL, { useNewUrlParser: true })
      .then(() => {
        console.log('connected to mongoDB ✅');
      })
      .catch(e => {
        console.log('MongoDB connection error. Please make sure MongoDB is running. ' + e);
      });
    mongoose.set('useCreateIndex', true);
  }

  private async initializeRedis() {
    // connect redis
    if (!redisClient.connected) {
      await redisClient.connect();
    } else {
      console.log('reusing redis connection...');
    }
  }

  private routes(): void {
    const { app } = this;
    app.use(routes.routes()).use(routes.allowedMethods());
  }
}

export default new Server().app;
