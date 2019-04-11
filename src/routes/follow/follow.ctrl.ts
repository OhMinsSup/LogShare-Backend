import { Context, Middleware } from 'koa';
import { Types } from 'mongoose';
import { pick } from 'lodash';
import User from '../../models/User';
import Follow from '../../models/Follow';
import { checkEmpty } from '../../lib/utils';

export const getFollow: Middleware = async (ctx: Context) => {
  interface ParamSchema {
    name: string;
  }

  const { _id: userId } = ctx.state.user;
  const { name } = ctx.params as ParamSchema;
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
    const user = await User.findByEmailOrUsername(null, name);
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

    ctx.type = 'application/json';
    ctx.body = {
      follow,
    };
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const follow: Middleware = async (ctx: Context) => {
  interface ParamSchema {
    name: string;
  }

  const { name } = ctx.params as ParamSchema;
  const {
    _id: userId,
    profile: { username },
  } = ctx.state.user;

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
    const user = await User.findByEmailOrUsername(null, name);
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

    new Follow({
      following: followId,
      follower: userId,
    }).save();

    ctx.type = 'application/json';
    ctx.body = {
      follow: true,
    };

    setImmediate(() => {
      User.followCount('follower', userId, true);
      User.followCount('following', followId, true);
    });
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const unfollow: Middleware = async (ctx: Context) => {
  interface ParamSchema {
    name: string;
  }

  const { name } = ctx.params as ParamSchema;
  const {
    _id: userId,
    profile: { username },
  } = ctx.state.user;

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
    const user = await User.findByEmailOrUsername(null, name);
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

    await Follow.deleteOne({ $and: [{ following: followId }, { follower: userId }] }).exec();

    ctx.type = 'application/json';
    ctx.body = {
      follow: false,
    };

    setImmediate(() => {
      User.followCount('follower', userId, false);
      User.followCount('following', followId, false);
    });
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const getFollowingList: Middleware = async (ctx: Context) => {
  interface ParamSchema {
    name: string;
  }

  interface QuerySchema {
    cursor: string | null;
  }

  const { name } = ctx.params as ParamSchema;
  if (checkEmpty(name)) {
    ctx.status = 400;
    ctx.body = {
      name: 'INVALID_NAME',
    };
    return;
  }

  const { cursor } = ctx.params as QuerySchema;
  if (cursor && !Types.ObjectId.isValid(cursor)) {
    ctx.status = 400;
    ctx.body = {
      name: 'Not ObjectId',
    };
    return;
  }

  try {
    const user = await User.findByEmailOrUsername(null, name);
    if (!user) {
      ctx.status = 404;
      ctx.body = {
        name: 'User',
        payload: '유저가 만들어지지 않았습니다.',
      };
      return;
    }

    const query = Object.assign(
      {},
      cursor
        ? {
            $and: [
              {
                _id: { $lt: cursor },
              },
              {
                follower: user._id,
              },
            ],
          }
        : {
            follower: user._id,
          }
    );

    const follow = await Follow.find(query)
      .sort({ _id: -1 })
      .select('following')
      .populate('following')
      .limit(10)
      .exec();

    const next = follow.length === 10 ? `/follow/${name}/following?cursor=${follow[9]._id}` : null;

    ctx.type = 'application/json';
    ctx.body = {
      next,
      usersWithData: follow.map(follow => {
        const { following } = follow;
        return {
          ...pick(following, ['_id']),
          ...pick(following.profile, ['username', 'thumbnail', 'shortBio', 'cover']),
        };
      }),
    };
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const getFollowerList: Middleware = async (ctx: Context) => {
  interface ParamSchema {
    name: string;
  }

  interface QuerySchema {
    cursor: string | null;
  }

  const { name } = ctx.params as ParamSchema;
  if (checkEmpty(name)) {
    ctx.status = 400;
    ctx.body = {
      name: 'INVALID_NAME',
    };
    return;
  }

  const { cursor } = ctx.params as QuerySchema;

  if (cursor && !Types.ObjectId.isValid(cursor)) {
    ctx.status = 400;
    ctx.body = {
      name: 'Not ObjectId',
    };
    return;
  }

  try {
    const user = await User.findByEmailOrUsername(null, name);
    if (!user) {
      ctx.status = 404;
      ctx.body = {
        name: 'User',
        payload: '유저가 만들어지지 않았습니다.',
      };
      return;
    }

    const query = Object.assign(
      {},
      cursor
        ? {
            $and: [
              {
                _id: { $lt: cursor },
              },
              {
                following: user._id,
              },
            ],
          }
        : {
            following: user._id,
          }
    );

    const follow = await Follow.find(query)
      .sort({ _id: -1 })
      .select('follower')
      .populate('follower')
      .limit(10)
      .exec();

    const next = follow.length === 10 ? `/follow/${name}/follower?cursor=${follow[9]._id}` : null;

    ctx.type = 'application/json';
    ctx.body = {
      next,
      usersWithData: follow.map(follow => {
        const { follower } = follow;
        return {
          ...pick(follower, ['_id', 'username']),
          ...pick(follower.profile, ['username', 'thumbnail', 'shortBio', 'cover']),
        };
      }),
    };
  } catch (e) {
    ctx.throw(500, e);
  }
};
