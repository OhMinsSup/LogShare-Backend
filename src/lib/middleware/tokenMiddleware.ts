import { Context } from 'koa';
import { decodeToken, TokenPayload } from '../token';

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
    const decoded = await decodeToken(token);

    const { _id, email, profile, exp } = decoded;
    const user: TokenPayload = {
      _id,
      email,
      profile,
    };

    (ctx['user'] as TokenPayload) = user;
    (ctx['tokenExpire'] as Date) = new Date(exp * 1000);
  } catch (e) {
    ctx['user'] = null;
  }

  return next();
};
