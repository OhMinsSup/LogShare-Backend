import { Context, Middleware } from 'koa';
import { TokenPayload } from '../../../lib/token';
import User from '../../../models/User';
import Follow from '../../../models/Follow';
import { serializeFollowing, serializeFollower } from '../../../lib/serialized';
import { Types } from 'mongoose';
import { checkEmpty } from '../../../lib/common';

export const getFollow: Middleware = async (ctx: Context) => {
  type ParamsPayload = {
    name: string;
  };

  const { _id: userId }: TokenPayload = ctx['user'];
  const { name }: ParamsPayload = ctx.params;

  if (checkEmpty(name)) {
    ctx.status = 400;
    ctx.body = {
      name: 'INVALID_NAME',
    };
    return;
  }

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

export const follow: Middleware = async (ctx: Context) => {
  type ParamsPayload = {
    name: string;
  };

  const { name }: ParamsPayload = ctx.params;
  const {
    _id: userId,
    profile: { username },
  }: TokenPayload = ctx['user'];

  if (checkEmpty(name)) {
    ctx.status = 400;
    ctx.body = {
      name: 'INVALID_NAME',
    };
    return;
  }

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

    const followId: string = user._id;

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

export const unfollow: Middleware = async (ctx: Context) => {
  type ParamsPayload = {
    name: string;
  };

  const { name }: ParamsPayload = ctx.params;
  const {
    _id: userId,
    profile: { username },
  }: TokenPayload = ctx['user'];

  if (checkEmpty(name)) {
    ctx.status = 400;
    ctx.body = {
      name: 'INVALID_NAME',
    };
    return;
  }

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

    const followId: string = user._id;

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

export const getFollowingList: Middleware = async (
  ctx: Context
): Promise<any> => {
  type ParamsPayload = {
    name: string;
  };

  type QueryPayload = {
    cursor: string | null;
  };

  const { name }: ParamsPayload = ctx.params;

  if (checkEmpty(name)) {
    ctx.status = 400;
    ctx.body = {
      name: 'INVALID_NAME',
    };
    return;
  }

  const { cursor }: QueryPayload = ctx.params;

  if (cursor && !Types.ObjectId.isValid(cursor)) {
    ctx.status = 400;
    ctx.body = {
      name: 'Not ObjectId',
    };
    return;
  }

  try {
    const user = await User.findByEmailOrUsername('username', name);

    if (!user) {
      ctx.status = 404;
      ctx.body = {
        name: 'User',
        payload: '유저가 만들어지지 않았습니다.',
      };
      return;
    }

    const following = await Follow.getfollowingList(user._id, cursor);

    if (following.length === 0 || !following) {
      ctx.body = {
        next: '',
        usersWithData: [],
      };
      return;
    }

    const next =
      following.length === 10
        ? `/common/follow/${name}/following?cursor=${following[9]._id}`
        : null;

    ctx.body = {
      next,
      usersWithData: following.map(serializeFollowing),
    };
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const getFollowerList: Middleware = async (
  ctx: Context
): Promise<any> => {
  type ParamsPayload = {
    name: string;
  };

  type QueryPayload = {
    cursor: string | null;
  };

  const { name }: ParamsPayload = ctx.params;

  if (checkEmpty(name)) {
    ctx.status = 400;
    ctx.body = {
      name: 'INVALID_NAME',
    };
    return;
  }

  const { cursor }: QueryPayload = ctx.params;

  if (cursor && !Types.ObjectId.isValid(cursor)) {
    ctx.status = 400;
    ctx.body = {
      name: 'Not ObjectId',
    };
    return;
  }

  try {
    const user = await User.findByEmailOrUsername('username', name);

    if (!user) {
      ctx.status = 404;
      ctx.body = {
        name: 'User',
        payload: '유저가 만들어지지 않았습니다.',
      };
      return;
    }

    const follower = await Follow.getfollowerList(user._id, cursor);

    if (follower.length === 0 || !follower) {
      ctx.body = {
        next: '',
        usersWithData: [],
      };
      return;
    }

    const next =
      follower.length === 10
        ? `/common/follow/${name}/follower?cursor=${follower[9]._id}`
        : null;

    ctx.body = {
      next,
      usersWithData: follower.map(serializeFollower),
    };
  } catch (e) {
    ctx.throw(500, e);
  }
};
