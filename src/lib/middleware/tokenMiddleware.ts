import { Context } from 'koa';
import { decodeToken } from '../token';

/**
 * @description JWT 미들웨어
 * @param {Context} ctx
 * @param {() => Promise<any>} next
 * @returns {() => Promise<any>} next()
 */
export default async (ctx: Context, next: () => Promise<any>) => {
  const token: string | void = ctx.cookies.get('access_token');

  if (!token) {
    ctx['user'] = null;
    return next();
  }

  try {
    const decoded: any = await decodeToken(token);
    const { user, exp } = decoded;

    ctx['user'] = user;
    ctx['tokenExpire'] = new Date(exp * 1000);
  } catch (e) {
    ctx['user'] = null;
  }

  return next();
};
