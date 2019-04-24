import { Context } from 'koa';

export default (ctx: Context, next: () => Promise<any>) => {
  if (process.env.NODE_ENV === 'development') {
    ctx.set('Access-Control-Allow-Origin', 'http://localhost:3000');
  } else {
    ctx.set('Access-Control-Allow-Origin', 'https://logshare.netlify.com');
  }

  ctx.set('Access-Control-Allow-Credentials', true as any);
  ctx.set(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, x-timebase, Link'
  );
  ctx.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, PATCH, OPTIONS');
  ctx.set('Access-Control-Expose-Headers', 'Link');
  return next();
};
