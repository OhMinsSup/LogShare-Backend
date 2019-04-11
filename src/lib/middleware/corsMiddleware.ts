import { Context } from 'koa';

export default async (ctx: Context, next: () => Promise<any>) => {
  if (process.env.NODE_ENV === 'development') {
    ctx.set('Access-Control-Allow-Origin', 'http://localhost:3000');
  } else {
    ctx.set('Access-Control-Allow-Origin', 'https://logshare.netlify.com');
  }

  ctx.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  ctx.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  ctx.set('Access-Control-Allow-Credentials', true as any);
  return await next();
};
