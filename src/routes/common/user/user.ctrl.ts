import { Context, Middleware } from 'koa';
import User from '../../../models/User';

export const getUserInfo: Middleware = async (ctx: Context): Promise<any> => {
  type ParamPayload = {
    username: string;
  };

  const { username }: ParamPayload = ctx.params;

  try {
    const user = await User.findByEmailOrUsername('username', username);

    if (!user) {
      ctx.status = 404;
      return;
    }

    ctx.body = {
      profile: user.profile,
      info: user.info,
    };
  } catch (e) {
    ctx.throw(500, e);
  }
};
