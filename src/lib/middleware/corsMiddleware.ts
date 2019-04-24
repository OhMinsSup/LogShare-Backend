import { Context } from 'koa';

export default (ctx: Context, next: () => Promise<any>) => {
  if (process.env.NODE_ENV === 'development') {
    ctx.set('Access-Control-Allow-Origin', 'http://localhost:3000');
  } else {
    ctx.set('Access-Control-Allow-Origin', 'https://logshare.netlify.com');
  }

  if (ctx.headers.referer && ctx.headers.referer.indexOf('localhost:4001') > -1) {
    ctx.set('Access-Control-Allow-Origin', 'http://localhost:4001');
  }
  ctx.set('Access-Control-Allow-Credentials', 'true');
  return next();
};
