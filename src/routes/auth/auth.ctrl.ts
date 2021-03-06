import { Middleware, Context } from 'koa';
import * as Joi from 'joi';
import User from '../../models/User';
import { TokenPayload, decodeToken, generateToken, setTokenCookie } from '../../lib/token';
import Social, { Profile } from '../../lib/social';

export const localRegister: Middleware = async (ctx: Context) => {
  type BodySchema = {
    username: string;
    email: string;
    password: string;
  };

  const schema = Joi.object().keys({
    username: Joi.string()
      .min(4)
      .max(15)
      .required(),
    email: Joi.string()
      .email()
      .required(),
    password: Joi.string()
      .min(6)
      .required(),
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
    const exists = await User.findByEmailOrUsername(email, username);

    if (exists) {
      ctx.status = 409;
      ctx.body = {
        name: '중복된 계정',
        payload: email === exists.email ? 'email' : 'username',
      };
      return;
    }

    const user = await User.localRegister(username, email, password);
    const token = await user.generate();
    setTokenCookie(ctx, token);
    ctx.type = 'application/json';
    ctx.body = {
      user: {
        _id: user._id,
        email: user.email,
        profile: {
          username: user.profile.username,
          thumbnail: user.profile.thumbnail,
          shortBio: user.profile.shortBio,
        },
      },
    };
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const localLogin: Middleware = async (ctx: Context) => {
  type BodySchema = {
    email: string;
    password: string;
  };

  const schema = Joi.object().keys({
    email: Joi.string()
      .email()
      .required(),
    password: Joi.string()
      .min(6)
      .required(),
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
    const user = await User.findByEmailOrUsername(email);
    if (!user || !user.validatePassword(password)) {
      ctx.status = 403;
      ctx.body = {
        name: 'ERROR EXIST',
        payload: !user ? '계정을 찾을 수 없습니다.' : '비밀 번호가 일치하지 않습니다.',
      };
      return;
    }

    const token = await user.generate();
    setTokenCookie(ctx, token);
    ctx.type = 'application/json';
    ctx.body = {
      user: {
        _id: user._id,
        email: user.email,
        profile: {
          username: user.profile.username,
          thumbnail: user.profile.thumbnail,
          shortBio: user.profile.shortBio,
        },
      },
    };
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const logout: Middleware = async (ctx: Context) => {
  setTokenCookie(ctx, null);
  ctx.type = 'application/json';
  ctx.status = 200;
};

export const checkExists: Middleware = async (ctx: Context) => {
  type ParamsPayload = {
    key: 'email' | 'username';
    value: string;
  };

  const { key, value }: ParamsPayload = ctx.params;

  try {
    const user = await (key == 'email'
      ? User.findByEmailOrUsername(value, null)
      : User.findByEmailOrUsername(null, value));
    ctx.type = 'application/json';
    ctx.body = {
      exists: !!user,
    };
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const checkUser: Middleware = async (ctx: Context) => {
  const user = ctx.state.user;
  if (!user) {
    ctx.status = 403;
    return;
  }

  ctx.type = 'application/json';
  ctx.body = {
    user,
  };
};

export const socialRegister: Middleware = async (ctx: Context) => {
  type BodySchema = {
    accessToken: string;
    username: string;
  };

  type ParamsPayload = {
    provider: string;
  };

  const schema = Joi.object().keys({
    accessToken: Joi.string().required(),
    username: Joi.string()
      .min(1)
      .max(40)
      .required(),
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

  const { provider }: ParamsPayload = ctx.params;
  const { username, accessToken }: BodySchema = ctx.request.body;

  let profile: Profile;

  try {
    profile = await Social(provider, accessToken);

    if (!profile) {
      ctx.status = 401;
      ctx.body = {
        name: 'Social',
        payload: '소셜 정보를 가져오지 못했습니다',
      };
      return;
    }

    const { id: socialId, thumbnail, name, email } = profile;

    const [emailExists, usernameExists] = await Promise.all([
      User.findByEmailOrUsername('email', email),
      User.findByEmailOrUsername('username', name),
    ]);

    if (emailExists || usernameExists) {
      ctx.status = 409;
      ctx.body = {
        name: 'Social 중복된 계정',
        payload: emailExists ? 'email' : 'username',
      };
      return;
    }

    const socialExists = await User.findBySocial(provider, socialId);

    if (socialExists) {
      ctx.status = 409;
      ctx.body = {
        name: 'Social 중복된 계정',
        payload: '이미 가입한 소셜 계정입니다',
      };
      return;
    }

    const user = await new User({
      profile: {
        username,
        thumbnail,
      },
      email,
      social: {
        [provider]: {
          id: socialId,
          accessToken,
        },
      },
    }).save();

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
      // domain: process.env.NODE_ENV === 'development' ? undefined : '.logshare.netlify.com',
    });
    ctx.type = 'application/json';
    ctx.body = {
      user: {
        _id: user._id,
        email: user.email,
        profile: {
          username: user.profile.username,
          thumbnail: user.profile.thumbnail,
          shortBio: user.profile.shortBio,
        },
      },
    };
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const socialLogin: Middleware = async (ctx: Context) => {
  type BodySchema = {
    accessToken: string;
  };

  type ParamsPayload = {
    provider: string;
  };

  const { accessToken }: BodySchema = ctx.request.body;
  const { provider }: ParamsPayload = ctx.params;

  let profile: Profile;

  try {
    profile = await Social(provider, accessToken);

    if (!profile) {
      ctx.status = 401;
      ctx.body = {
        name: 'Social',
        payload: '소셜 정보를 가져오지 못했습니다',
      };
      return;
    }

    const { id: socialId, email } = profile;

    let user = await User.findBySocial(provider, socialId);

    if (!user) {
      user = await User.findByEmailOrUsername('email', email);

      if (!user) {
        ctx.status = 404;
        ctx.body = {
          name: 'Social',
          payload: '등록되어 있지 않습니다.',
        };
        return;
      }

      await new User({
        social: {
          [provider]: {
            id: socialId,
            accessToken,
          },
        },
      }).save();
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
      // domain: process.env.NODE_ENV === 'development' ? undefined : '.logshare.netlify.com',
    });
    ctx.type = 'application/json';
    ctx.body = {
      user: {
        _id: user._id,
        email: user.email,
        profile: {
          username: user.profile.username,
          thumbnail: user.profile.thumbnail,
          shortBio: user.profile.shortBio,
        },
      },
    };
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const verifySocial: Middleware = async (ctx: Context) => {
  type BodySchema = {
    accessToken: string;
  };

  type ParamsPayload = {
    provider: string;
  };

  const { accessToken }: BodySchema = ctx.request.body;
  const { provider }: ParamsPayload = ctx.params;

  let profile: Profile;

  try {
    profile = await Social(provider, accessToken);

    if (!profile) {
      ctx.status = 401;
      ctx.body = {
        name: 'Social',
        payload: '소셜 정보를 가져오지 못했습니다',
      };
      return;
    }

    const [socialAuth, user] = await Promise.all([
      User.findBySocial(provider, profile.id),
      User.findByEmailOrUsername('email', profile.email),
    ]);

    ctx.type = 'application/json';
    ctx.body = {
      profile,
      exists: !!(socialAuth || user),
    };
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const generateUnregisterToken: Middleware = async (ctx: Context) => {
  const {
    profile: { username },
  }: TokenPayload = ctx['user'];

  try {
    const token = await generateToken(
      { username },
      {
        expiresIn: '1h',
        subject: 'unregister',
      }
    );

    ctx.type = 'application/json';
    ctx.body = {
      unregister_token: token,
    };
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const unRegister: Middleware = async (ctx: Context) => {
  type BodySchema = {
    unregister_token: string;
  };

  const schema = Joi.object().keys({
    unregister_token: Joi.string().required(),
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

  const {
    _id: userId,
    profile: { username },
  }: TokenPayload = ctx['user'];

  const { unregister_token }: BodySchema = ctx.request.body;

  try {
    const decoded = await decodeToken(unregister_token);

    if (decoded.profile.username !== username) {
      ctx.status = 400;
      return;
    }

    const user = await User.findById(userId).exec();

    if (!user) {
      ctx.state = 400;
      return;
    }

    await user.remove();
    ctx.type = 'application/json';
    ctx.cookies.set('access_token', '');
    ctx.status = 204;
  } catch (e) {
    ctx.throw(500, e);
  }
};
