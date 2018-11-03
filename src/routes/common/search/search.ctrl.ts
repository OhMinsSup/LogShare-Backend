import { Context, Middleware } from 'koa';
import Post, { IPost } from '../../../models/Post';
import User, { IUser } from '../../../models/User';

export const searchPostList: Middleware = async (
  ctx: Context
): Promise<any> => {
  type ParamsPayload = {
    value: string;
  };

  const { value }: ParamsPayload = ctx.params;

  const regex = new RegExp('^' + value);

  try {
    const post: IPost[] = await Post.find(
      {
        $or: [
          {
            title: { $regex: regex },
          },
          {
            body: { $regex: regex },
          },
        ],
      },
      {
        title: true,
        body: true,
        post_thumbnail: true,
        createdAt: true,
        info: true,
      }
    )
      .sort({ _id: -1 })
      .lean()
      .exec();

    ctx.body = post;
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const searchUserList: Middleware = async (
  ctx: Context
): Promise<any> => {
  type ParamsPayload = {
    value: string;
  };

  const { value }: ParamsPayload = ctx.params;

  const regex = new RegExp('^' + value);

  try {
    const user: IUser[] = await User.find(
      {
        'profile.username': { $regex: regex },
      },
      {
        profile: true,
      }
    )
      .sort({ _id: -1 })
      .lean()
      .exec();

    ctx.body = user;
  } catch (e) {
    ctx.throw(500, e);
  }
};
