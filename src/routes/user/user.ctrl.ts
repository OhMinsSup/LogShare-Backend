import * as Joi from 'joi';
import { Context, Middleware } from 'koa';
import { Types } from 'mongoose';
import User from '../../models/User';
import { checkEmpty } from '../../lib/utils';

export const getUserInfo: Middleware = async (ctx: Context) => {
  interface ParamSchema {
    name: string;
  }
  const { name } = ctx.params as ParamSchema;
  if (checkEmpty(name)) {
    ctx.status = 400;
    ctx.body = {
      name: 'INVALID_NAME',
    };
    return;
  }

  try {
    const user = await User.findByEmailOrUsername(null, name);
    if (!user) {
      ctx.status = 404;
      return;
    }

    ctx.type = 'application/json';
    ctx.body = {
      email: user.email,
      profile: user.profile,
      info: user.info,
      createdAt: user.createdAt,
    };
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const profileUpdate: Middleware = async (ctx: Context) => {
  interface BodySchema {
    username: string;
    thumbnail: string;
    shortBio: string;
  }

  const schema = Joi.object().keys({
    username: Joi.string()
      .min(2)
      .max(15),
    thumbnail: Joi.string().uri(),
    shortBio: Joi.string().max(140),
    cover: Joi.string().uri(),
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

  const body = ctx.request.body as BodySchema;
  const { username } = body;
  if (username && checkEmpty(username)) {
    ctx.status = 400;
    ctx.body = {
      name: 'INVALID_NAME',
    };
    return;
  }

  const { _id: userId } = ctx.state.user;

  try {
    const profile = await User.findOne({ _id: userId }).exec();
    if (!profile) {
      ctx.throw(500, 'Invalid Profile');
    }

    ['username', 'shortBio', 'thumbnail', 'cover'].forEach(key => {
      if (body[key]) {
        profile.profile[key] = body[key];
      }
    });
    await profile.save();

    ctx.type = 'application/json';
    ctx.body = {
      profile,
    };
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const usersList: Middleware = async (ctx: Context) => {
  interface QueryShema {
    cursor: string | null;
  }

  const { cursor } = ctx.query as QueryShema;
  if (cursor && !Types.ObjectId.isValid(cursor)) {
    ctx.status = 400;
    ctx.body = {
      name: 'Not ObjectId',
    };
    return;
  }

  const query = Object.assign({}, cursor ? { _id: { $lt: cursor } } : {});

  try {
    const users = await User.find(query)
      .select('profile')
      .sort({ _id: -1 })
      .limit(10)
      .exec();

    const next = users.length === 10 ? `/user?cursor=${users[9]._id}` : null;

    ctx.type = 'application/json';
    ctx.body = {
      next,
      usersWithData: users.map(user => {
        const {
          _id,
          profile: { username, thumbnail, shortBio, cover },
        } = user;
        return {
          _id,
          username,
          thumbnail,
          shortBio,
          cover,
        };
      }),
    };
  } catch (e) {
    ctx.throw(500, e);
  }
};
