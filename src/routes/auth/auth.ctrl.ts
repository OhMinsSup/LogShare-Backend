import { Middleware, Context } from 'koa';
import * as Joi from 'joi';
import User, { IUser } from '../../models/User';

export const localRegister: Middleware = async (ctx: Context) => {
  type BodySchema = {
    username: string;
    email: string;
    password: string;
  };

  const schema = Joi.object().keys({
    username: Joi.string()
      .alphanum()
      .min(4)
      .max(15)
      .required(),
    email: Joi.string()
      .email()
      .required(),
    password: Joi.string()
      .required()
      .min(6),
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

  const { username, email, password }: BodySchema = ctx.request.body;

  try {
    const [emailExists, usernameExists] = await Promise.all([
      await User.findByEmailOrUsername('email', email),
      await User.findByEmailOrUsername('username', username),
    ]);

    if (emailExists || usernameExists) {
      ctx.status = 409;
      ctx.body = {
        name: '중복된 계정',
        payload: emailExists ? 'email' : 'username',
      };
      return;
    }

    const user = await User.localRegister(username, email, password);

    if (!user) {
      ctx.status = 404;
      ctx.body = {
        name: 'User',
        payload: '유저가 만들어지지 않았습니다.',
      };
      return;
    }

    const token = await user.generate();

    if (!token) {
      await user.remove();
      ctx.status = 409;
      ctx.body = {
        name: '토큰 발급',
        payload: '토큰이 만들어지지 않았습니다 다시 회원가입을 해주세요',
      };
      return;
    }

    ctx.cookies.set('access_token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    ctx.body = {
      user: {
        username: user.profile.username,
        thumbnail: user.profile.thumbnail,
        shortBio: user.profile.shortBio,
        email: user.email,
        token,
      },
    };
  } catch (e) {
    ctx.throw(500, e);
  }
};
