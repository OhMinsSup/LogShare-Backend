import { Context } from 'koa';
import { decodeToken, TokenPayload } from '../token';

export default async (ctx: Context, next: () => Promise<any>) => {
  let token: string | void = ctx.cookies.get('access_token');

  if (!token) {
    ctx.state.user = null;
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
    ctx.state.user = user;
    ctx.state.tokenExpire = new Date(exp * 1000);
  } catch (e) {
    ctx.state.user = null;
  }
  return next();
};
