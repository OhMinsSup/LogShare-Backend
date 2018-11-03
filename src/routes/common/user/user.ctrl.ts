import { Context, Middleware } from 'koa';
import * as Joi from 'joi';
import User, { IUser } from '../../../models/User';
import { checkEmpty } from '../../../lib/common';
import { TokenPayload } from '../../../lib/token';

/**
 * @description 유저 정보를 보여주는 api
 * @return {Promise<any>}
 * @param {Context} ctx koa Context
 */
export const getUserInfo: Middleware = async (ctx: Context): Promise<any> => {
  type ParamPayload = {
    name: string;
  };

  const { name }: ParamPayload = ctx.params;

  try {
    const user = await User.findByEmailOrUsername('username', name);

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

export const profileUpdate: Middleware = async (ctx: Context): Promise<any> => {
  type BodySchema = {
    username: string;
    thumbnail: string;
    shortBio: string;
  };

  const schema = Joi.object().keys({
    username: Joi.string()
      .alphanum()
      .min(4)
      .max(15),
    thumbnail: Joi.string(),
    shortBio: Joi.string().max(140),
  });

  const result = Joi.validate(ctx.request.body, schema);

  if (result.error) {
    ctx.status = 400;
    ctx.body = {
      name: 'WRONG_SCHEMA',
      payload: result.error,
    };
    return;
  }

  const body: BodySchema = ctx.request.body;
  const { username } = body;

  if (username && checkEmpty(username)) {
    ctx.status = 400;
    ctx.body = {
      name: 'INVALID_NAME',
    };
    return;
  }

  const { _id: userId }: TokenPayload = ctx['user'];

  try {
    const profile: IUser = await User.findById(userId)
      .lean()
      .exec();

    if (!profile) {
      ctx.throw(500, 'Invalid Profile');
    }

    ['username', 'shortBio', 'thumbnail'].forEach(key => {
      if (body[key]) {
        profile.profile[key] = body[key];
      }
    });

    await profile.save();

    ctx.body = {
      profile,
    };
  } catch (e) {
    ctx.throw(500, e);
  }
};
