import { Context, Middleware } from 'koa';
import Post, { IPost } from '../../../models/Post';
import User, { IUser } from '../../../models/User';
import { serializePost, serializeUsers } from '../../../lib/serialized';
import { formatShortDescription } from '../../../lib/common';

export const searchPostList: Middleware = async (ctx: Context) => {
  type ParamsPayload = {
    value: string;
  };

  const { value }: ParamsPayload = ctx.params;

  const regex = new RegExp('^' + value);

  try {
    const post: IPost[] = await Post.find({
      $or: [
        {
          title: { $regex: regex },
        },
        {
          body: { $regex: regex },
        },
      ],
    })
      .sort({ _id: -1 })
      .populate('user')
      .lean()
      .exec();

    ctx.body = post.map(serializePost).map(post => ({
      ...post,
      body: formatShortDescription(post.body, 'markdown'),
    }));
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const searchUserList: Middleware = async (ctx: Context) => {
  type ParamsPayload = {
    value: string;
  };

  const { value }: ParamsPayload = ctx.params;

  const regex = new RegExp('^' + value);

  try {
    const user: IUser[] = await User.find({
      'profile.username': { $regex: regex },
    })
      .sort({ _id: -1 })
      .lean()
      .exec();

    ctx.body = user.map(serializeUsers);
  } catch (e) {
    ctx.throw(500, e);
  }
};
