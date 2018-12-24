import { Context } from 'koa';

export default (ctx: Context, next: () => Promise<any>) => {
  ctx.set('Access-Control-Allow-Origin', '*');
  if (
    ctx.headers.referer &&
    ctx.headers.referer.indexOf('localhost:3000') > -1
  ) {
    ctx.set('Access-Control-Allow-Origin', '*');
  }
  ctx.set('Access-Control-Allow-Credentials', true as any);
  return next();
};
