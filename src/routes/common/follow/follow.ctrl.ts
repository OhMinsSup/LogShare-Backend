import { Context, Middleware } from 'koa';
import { TokenPayload } from '../../../lib/token';
import User from '../../../models/User';
import Follow from '../../../models/Follow';

export const getFollow: Middleware = async (ctx: Context): Promise<any> => {
  type ParamsPayload = {
    name: string;
  };

  const { _id: userId }: TokenPayload = ctx['user'];
  const { name }: ParamsPayload = ctx.params;

  let follow = false;

  try {
    // 팔로우 되어있는지 확인
    const user = await User.findByEmailOrUsername('username', name);

    if (!user) {
      ctx.status = 403;
      ctx.body = {
        name: 'Follow',
        payload: '존재하지 않는 팔로우 유저입니다',
      };
      return;
    }

    if (userId) {
      // 팔로우 체크
      const following = user._id;
      const exists = await Follow.checkExists(userId, following);
      follow = !!exists;
    }

    ctx.body = {
      follow,
    };
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const follow: Middleware = async (ctx: Context): Promise<any> => {
  type ParamsPayload = {
    name: string;
  };

  const { name }: ParamsPayload = ctx.params;
  const {
    _id: userId,
    profile: { username },
  }: TokenPayload = ctx['user'];

  if (name === username) {
    ctx.status = 400;
    ctx.body = {
      name: 'Follow',
      payload: '자기 자신을 팔로우 할 수 없습니다.',
    };
    return;
  }

  try {
    const user = await User.findByEmailOrUsername('username', name);

    if (!user) {
      ctx.status = 403;
      ctx.body = {
        name: 'Follow',
        payload: '존재하지 않는 유저입니다',
      };
      return;
    }

    const followId = user._id;

    const exists = await Follow.checkExists(userId, followId);

    if (exists) {
      ctx.status = 409;
      ctx.body = {
        name: 'Follow',
        payload: '이미 팔로우 중입니다..',
      };
      return;
    }

    await new Follow({
      following: followId,
      follower: userId,
    }).save();

    await User.Count('follower', userId);
    await User.Count('following', followId);

    ctx.body = {
      follow: true,
    };
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const unfollow: Middleware = async (ctx: Context): Promise<any> => {
  type ParamsPayload = {
    name: string;
  };

  const { name }: ParamsPayload = ctx.params;
  const {
    _id: userId,
    profile: { username },
  }: TokenPayload = ctx['user'];

  if (name === username) {
    ctx.status = 400;
    ctx.body = {
      name: 'Follow',
      payload: '자기 자신을 언팔로우 할 수 없습니다.',
    };
    return;
  }

  try {
    const user = await User.findByEmailOrUsername('username', name);

    if (!user) {
      ctx.status = 403;
      ctx.body = {
        name: 'Follow',
        payload: '존재하지 않는 유저입니다',
      };
      return;
    }

    const followId = user._id;

    const exists = await Follow.checkExists(userId, followId);

    if (!exists) {
      ctx.status = 409;
      ctx.body = {
        name: 'Follow',
        payload: '팔로우 상태가 아닙니다.',
      };
      return;
    }

    await Follow.deleteOne({ following: followId, follower: userId })
      .lean()
      .exec();

    await User.unCount('follower', userId);
    await User.unCount('following', followId);

    ctx.body = {
      follow: false,
    };
  } catch (e) {
    ctx.throw(500, e);
  }
};
