import { Context, Middleware } from 'koa';
import User from '../../../models/User';
import Post, { IPost } from '../../../models/Post';
import { serializePost, serializePoplatePost } from '../../../lib/serialized';
import {
  formatShortDescription,
  checkEmpty,
  filterUnique,
} from '../../../lib/common';
import { Types } from 'mongoose';
import Like from '../../../models/Like';
import { TokenPayload } from '../../../lib/token';
import PostTag from '../../../models/PostTag';

/**@return {void}
 * @description 포스트 리스트(유저 | Public) API
 * @param {Context} ctx koa Context
 */
export const listPosts: Middleware = async (ctx: Context) => {
  type ParamPayload = {
    username: string | null;
  };

  type QueryPayload = {
    cursor: string | null;
  };

  const { username }: ParamPayload = ctx.params;
  const { cursor }: QueryPayload = ctx.query;

  if (cursor && !Types.ObjectId.isValid(cursor)) {
    ctx.status = 400;
    ctx.body = {
      name: 'Not ObjectId',
    };
    return;
  }

  let userId: string;

  try {
    if (username && !checkEmpty(username)) {
      let user = await User.findByEmailOrUsername('username', username);

      if (!user) {
        ctx.status = 404;
        ctx.body = {
          name: 'User',
          payload: '유저가 존재하지 않습니다.',
        };
        return;
      }

      userId = user._id;
    }

    const post = await Post.listPosts(userId, cursor);

    if (post.length === 0 || !post) {
      ctx.body = {
        next: '',
        postWithData: [],
      };
      return;
    }

    const next =
      post.length === 10
        ? `/post/list/${username ? `@${username}` : `public`}?cursor=${
            post[9]._id
          }`
        : null;

    const postWithData = post.map(serializePost).map(post => ({
      ...post,
      body: formatShortDescription(post.body, 'markdown'),
    }));

    ctx.body = {
      next,
      postWithData,
    };
  } catch (e) {
    ctx.throw(500, e);
  }
};

/**
 * @description 트렌딩 포스트를 보여주는 api
 * @return {Promise<any>}
 * @param {Context} ctx koa Context
 */
export const trendingPostList: Middleware = async (ctx: Context) => {
  type QueryPayload = {
    cursor: string | null;
  };

  const { cursor }: QueryPayload = ctx.query;

  if (cursor && !Types.ObjectId.isValid(cursor)) {
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
      return;
    }

    const next =
      post.length === 10 ? `/post/list/trending?cursor=${post[9]._id}` : null;

    const postWithData = post.map(serializePost).map(post => ({
      ...post,
      body: formatShortDescription(post.body, 'markdown'),
    }));

    ctx.body = {
      next,
      postWithData,
    };
  } catch (e) {
    ctx.throw(500, e);
  }
};

/**
 * @description 포스트를 작성한 순서대로 리스트를 출력하는 api
 * @return {Promise<any>}
 * @param {Context} ctx koa Context
 */
export const listSequences: Middleware = async (ctx: Context) => {
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
        .sort({ _id: 1 })
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
      body: formatShortDescription(post.body, 'markdown'),
    }));
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const likePostsList: Middleware = async (ctx: Context) => {
  type QueryPayload = {
    cursor: string | null;
  };

  type ParamsPayload = {
    username: string;
  };

  const { cursor }: QueryPayload = ctx.query;
  const { username }: ParamsPayload = ctx.params;

  if (username && checkEmpty(username)) {
    ctx.status = 400;
    ctx.body = {
      name: 'INVALID_USER_NAME',
    };
    return;
  }

  if (cursor && !Types.ObjectId.isValid(cursor)) {
    ctx.status = 400;
    ctx.body = {
      name: 'Not ObjectId',
    };
    return;
  }

  try {
    const user = await User.findByEmailOrUsername('username', username);

    if (!user) {
      ctx.status = 404;
      ctx.body = {
        name: 'User',
        payload: '유저가 존재하지 않습니다.',
      };
      return;
    }

    const post = await Like.likePosts(user._id, cursor);

    if (post.length === 0 || !post) {
      ctx.body = {
        next: '',
        postWithData: [],
      };
      return;
    }

    const next =
      post.length === 10
        ? `/post/list/likes/${username}?cursor=${post[9]._id}`
        : null;

    ctx.body = {
      next,
      postWithData: post.map(serializePoplatePost).map(post => ({
        ...post,
        body: formatShortDescription(post.body, 'markdown'),
      })),
    };
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const featuredPost: Middleware = async (ctx: Context) => {
  const user: TokenPayload = ctx['user'];

  if (!user) {
    ctx.body = {
      posts: [],
    };
    return;
  }

  try {
    const posts = await Post.aggregate([
      {
        $lookup: {
          from: 'posttags',
          localField: '_id',
          foreignField: 'post',
          as: 'post_tags_docs',
        },
      },
      { $unwind: '$post_tags_docs' },
      {
        $lookup: {
          from: 'posts',
          localField: 'post_tags_docs.post',
          foreignField: '_id',
          as: 'post_tags_docs.posts_docs',
        },
      },
      { $unwind: '$post_tags_docs.posts_docs' },
      {
        $project: {
          'post_tags_docs.posts_docs._id': 1,
          'post_tags_docs.posts_docs.user': 1,
          'post_tags_docs.posts_docs.title': 1,
          'post_tags_docs.posts_docs.info': 1,
        },
      },
      {
        $group: {
          _id: '$post_tags_docs.posts_docs._id',
          posts: { $first: '$post_tags_docs' },
        },
      },
      {
        $match: {
          'posts.posts_docs.user': { $ne: Types.ObjectId(user._id) },
        },
      },
    ])
      .sample(10)
      .limit(10)
      .exec();

    const serialized = posts.map(post => {
      const {
        posts: { posts_docs },
      } = post;

      return posts_docs;
    });

    ctx.body = {
      posts: serialized,
    };
  } catch (e) {
    ctx.throw(500, e);
  }
};
