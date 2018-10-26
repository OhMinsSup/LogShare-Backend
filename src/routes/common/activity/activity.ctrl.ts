import { Middleware, Context } from 'koa';
import User from '../../../models/User';
import Like from '../../../models/Like';
import Comment from '../../../models/Comment';
import Follow from '../../../models/Follow';
import { normalize } from '../../../lib/common';

/**
 * @description 유저가 활동한 기록을 보여주는 api
 * @return {Promise<any>}
 * @param {Context} ctx koa Context
 */
export const userHistory: Middleware = async (ctx: Context): Promise<any> => {
  type ParamsPayload = {
    name: string;
  };

  const { name }: ParamsPayload = ctx.params;

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

    const promises = [];

    promises.push(
      Like.find({ user: user._id })
        .sort({ createdAt: -1 })
        .populate('post')
        .lean()
        .exec()
    );

    promises.push(
      Comment.find({ user: user._id })
        .sort({ createdAt: -1 })
        .populate('post')
        .lean()
        .exec()
    );

    promises.push(
      Follow.find({ follower: user._id })
        .sort({ createdAt: -1 })
        .populate('following')
        .lean()
        .exec()
    );

    const [likes, comments, follows] = await Promise.all(promises);

    const normalized = {
      likes: normalize(likes, 'like'),
      comments: normalize(comments, 'comment'),
      follows: normalize(follows, 'follow'),
    };

    const serialized = [];

    normalized.follows.map(follow => serialized.push(follow));
    normalized.likes.map(like => serialized.push(like));
    normalized.comments.map(comment => serialized.push(comment));

    ctx.body = {
      history: serialized.sort((a, b) => {
        return b['createdAt'] - a['createdAt'];
      }),
    };
  } catch (e) {
    ctx.throw(500, e);
  }
};
