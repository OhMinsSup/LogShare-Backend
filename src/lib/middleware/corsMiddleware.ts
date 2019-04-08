import { Context } from 'koa';

export default async (ctx: Context, next: () => Promise<any>) => {
  ctx.set('Access-Control-Allow-Origin', '*');
  ctx.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  ctx.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  ctx.set('Access-Control-Allow-Credentials', true as any);
  return await next();
};
