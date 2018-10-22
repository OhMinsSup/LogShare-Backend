import { Middleware, Context } from 'koa';
import * as Joi from 'joi';
import User from '../../models/User';
import { Token } from '../../lib/token';

/**@return {void}
 * @description 로컬 회원가입 api
 * @param {Context} ctx koa Context
 */
export const localRegister: Middleware = async (ctx: Context): Promise<any> => {
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
      User.findByEmailOrUsername('email', email),
      User.findByEmailOrUsername('username', username),
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
      },
    };
  } catch (e) {
    ctx.throw(500, e);
  }
};

/**@return {void}
 * @description 로컬 로그인 api
 * @param {Context} ctx koa Context
 */
export const localLogin: Middleware = async (ctx: Context): Promise<any> => {
  type BodySchema = {
    email: string;
    password: string;
  };

  const schema = Joi.object().keys({
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

  const { email, password }: BodySchema = ctx.request.body;

  try {
    const user = await User.findByEmailOrUsername('email', email);

    if (!user || !user.validatePassword(password)) {
      ctx.status = 403;
      ctx.body = {
        name: 'ERROR EXIST',
        payload: !user
          ? '계정을 찾을 수 없습니다.'
          : '비밀 번호가 일치하지 않습니다.',
      };
      return;
    }

    const token = await user.generate();

    if (!token) {
      ctx.status = 409;
      ctx.body = {
        name: '토큰 발급',
        payload: '토큰이 만들어지지 않았습니다 다시 로그인해주세요',
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
      },
    };
  } catch (e) {
    ctx.throw(500, e);
  }
};

/**@return {void}
 * @description 로그아웃 api
 * @param {Context} ctx koa Context
 */
export const logout: Middleware = async (ctx: Context): Promise<any> => {
  ctx.cookies.set('access_token', null, {
    httpOnly: true,
    maxAge: 0,
  });

  ctx.status = 204;
};

/**@return {void}
 * @description 이메일 or 유저명 유효성 검사 api
 * @param {Context} ctx koa Context
 */
export const checkExists: Middleware = async (ctx: Context): Promise<any> => {
  type ParamsPayload = {
    key: 'email' | 'username';
    value: string;
  };

  const { key, value }: ParamsPayload = ctx.params;

  try {
    const user = await (key == 'email'
      ? User.findByEmailOrUsername('email', value)
      : User.findByEmailOrUsername('username', value));

    ctx.body = {
      exists: !!user,
    };
  } catch (e) {
    ctx.throw(500, e);
  }
};

/**@return {void}
 * @description 유저가 로그인인 중인지 체크하는 api
 * @param {Context} ctx koa Context
 */
export const checkUser: Middleware = async (ctx: Context): Promise<any> => {
  const user: Token = ctx['user'];

  if (!user) {
    ctx.status = 403;
    return;
  }

  ctx.body = {
    user,
  };
};
