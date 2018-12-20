import { Middleware, Context } from 'koa';
import Like from '../../../models/Like';
import Post from '../../../models/Post';

export const like: Middleware = async (ctx: Context) => {
  const postId: string = ctx['post']._id;
  const userId: string = ctx['user']._id;

  try {
    const exists = await Like.checkExists(userId, postId);

    if (exists) {
      ctx.status = 409;
      ctx.body = {
        name: 'Like',
        payload: '이미 like 중입니다',
      };
      return;
    }

    await new Like({
      user: userId,
      post: postId,
    }).save();

    await Post.Count('likes', postId);

    ctx.body = {
      liked: true,
      likes: (ctx['post'].info.likes + 1) as number,
    };

    await Post.findOneAndUpdate(
      {
        $and: [{ user: userId }, { _id: postId }],
      },
      {
        $inc: { 'info.score': 5 },
      },
      {
        new: true,
      }
    )
      .lean()
      .exec();
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const unlike: Middleware = async (ctx: Context) => {
  const postId: string = ctx['post']._id;
  const userId: string = ctx['user']._id;

  try {
    const exists = await Like.checkExists(userId, postId);

    if (!exists) {
      ctx.status = 409;
      ctx.body = {
        name: 'Like',
        payload: 'like를 하지 않았습니다',
      };
      return;
    }

    await Like.deleteOne({
      $and: [
        {
          post: postId,
          user: userId,
        },
      ],
    })
      .lean()
      .exec();

    await Post.unCount('likes', postId);

    ctx.body = {
      liked: false,
      likes: (ctx['post'].info.likes - 1) as number,
    };

    await Post.findOneAndUpdate(
      {
        $and: [{ user: userId }, { _id: postId }],
      },
      {
        $inc: { 'info.score': -5 },
      },
      {
        new: true,
      }
    )
      .lean()
      .exec();
  } catch (e) {
    ctx.throw(500, e);
  }
};
