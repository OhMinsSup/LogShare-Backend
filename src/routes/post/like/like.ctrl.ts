import { Middleware, Context } from 'koa';
import Like from '../../../models/Like';
import PostFeeds from '../../../models/PostFeeds';

export const like: Middleware = async (ctx: Context) => {
  const postId: string = ctx.state.post._id;
  const userId: string = ctx.state.user._id;
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
    try {
      await Like.create({
        user: userId,
        post: postId,
      });
    } catch (e) {
      ctx.status = 409;
      ctx.body = {
        name: 'Like',
        payload: 'ALREADY_LIKED',
      };
      return;
    }

    ctx.type = 'application/json';
    ctx.body = {
      liked: true,
      likes: ctx.state.post.info.likes + 1,
    };
    setImmediate(async () => {
      await ctx.state.post.likes(true);
      await ctx.state.post.count(5);
      await PostFeeds.createPostFeed(userId, postId);
    });
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const unlike: Middleware = async (ctx: Context) => {
  const postId: string = ctx.state.post._id;
  const userId: string = ctx.state.user._id;
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
    await exists.remove();

    ctx.type = 'application/json';
    ctx.body = {
      liked: false,
      likes: ctx.state.post.info.likes - 1,
    };
    setImmediate(() => {
      ctx.state.post.likes(false);
      ctx.state.post.count(-5);
    });
  } catch (e) {
    ctx.throw(500, e);
  }
};
