import { Context, Middleware } from 'koa';
import User from '../../../models/User';
import Post, { IPost } from '../../../models/Post';
import { serializePost } from '../../../lib/serialized';
import { formatShortDescription, checkObjectId } from '../../../lib/common';
import { Types } from 'mongoose';

/**@return {void}
 * @description 포스트 리스트(유저 | Public) API
 * @param {Context} ctx koa Context
 */
export const listPosts: Middleware = async (ctx: Context): Promise<any> => {
  type ParamPayload = {
    username: string | null;
  };

  type QueryPayload = {
    cursor: string | null;
  };

  const { username }: ParamPayload = ctx.params;
  const { cursor }: QueryPayload = ctx.query;

  let userId = '';

  try {
    if (username) {
      let user = await User.findByEmailOrUsername('username', username);

      userId = user._id;
    }

    const post = await Post.listPosts(userId, cursor);

    if (post.length === 0 || !post) {
      ctx.body = {
        next: '',
        postWithData: [],
      };
    }

    const next =
      post.length === 20
        ? `/post/list/${username ? `@${username}` : `public`}?cursor=${
            post[19]._id
          }`
        : null;

    const postWithData = post.map(serializePost).map(post => ({
      ...post,
      body: formatShortDescription(post.body, 'text'),
    }));

    ctx.body = {
      next,
      postWithData,
    };
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const trendingPostList: Middleware = async (
  ctx: Context
): Promise<any> => {
  type QueryPayload = {
    cursor: string | null;
  };

  const { cursor }: QueryPayload = ctx.query;

  if (!Types.ObjectId.isValid(cursor) && cursor) {
    ctx.status = 400;
    ctx.body = {
      name: 'Not ObjectId',
    };
    return;
  }

  try {
    const post = await Post.trendingPostList(cursor);

    if (post.length === 0 || !post) {
      ctx.body = {
        next: '',
        postWithData: [],
      };
    }

    const next =
      post.length === 20 ? `/post/list/trending?cursor=${post[19]._id}` : null;

    const postWithData = post.map(serializePost).map(post => ({
      ...post,
      body: formatShortDescription(post.body, 'text'),
    }));

    ctx.body = {
      next,
      postWithData,
    };
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const listSequences: Middleware = async (ctx: Context): Promise<any> => {
  type QueryPayload = {
    postId: string;
  };

  const { postId }: QueryPayload = ctx.query;

  if (!Types.ObjectId.isValid(postId)) {
    ctx.status = 400;
    ctx.body = {
      name: 'Not ObjectId',
    };
    return;
  }

  try {
    const post: IPost = await Post.findById(postId)
      .lean()
      .exec();

    const { user } = post;

    const promises = [];

    promises.push(
      Post.find({
        $and: [{ user }, { _id: { $lt: postId } }],
      })
        .limit(4)
        .lean()
        .exec()
    );

    promises.push(
      Post.find({
        $and: [{ user }, { _id: { $gt: postId } }],
      })
        .limit(4)
        .lean()
        .exec()
    );

    const [before, after] = await Promise.all(promises);

    const beforeCount = after.length < 2 ? 4 - after.length : 2;
    const afterCount = before.length < 2 ? 4 - before.length : 2;

    ctx.body = [
      ...before.slice(before.length - beforeCount, before.length),
      post,
      ...after.slice(0, afterCount),
    ].map(post => ({
      ...post,
      body: formatShortDescription(post.body, 'text'),
    }));
  } catch (e) {
    ctx.throw(500, e);
  }
};
