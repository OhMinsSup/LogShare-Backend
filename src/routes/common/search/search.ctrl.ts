import { Context, Middleware } from 'koa';
import Post from '../../../models/Post';
import { checkEmpty } from '../../../lib/common';
import User from '../../../models/User';

export const searchPostList: Middleware = async (
  ctx: Context
): Promise<any> => {
  type ParamsPayload = {
    value: string;
  };

  const { value }: ParamsPayload = ctx.params;

  if (checkEmpty(value)) {
    ctx.status = 400;
    ctx.body = {
      name: 'INVALID_TEXT',
    };
    return;
  }

  const regex = new RegExp('^' + value);

  try {
    const post = await Post.find(
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

  if (checkEmpty(value)) {
    ctx.status = 400;
    ctx.body = {
      name: 'INVALID_TEXT',
    };
    return;
  }

  const regex = new RegExp('^' + value);

  try {
    const user = await User.find(
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
