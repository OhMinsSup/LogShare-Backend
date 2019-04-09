import { Context, Middleware } from 'koa';
import { pick } from 'lodash';
import User from '../../../models/User';
import Post, { IPost } from '../../../models/Post';
import { serializePost, serializePoplatePost } from '../../../lib/serialized';
import { formatShortDescription, checkEmpty } from '../../../lib/utils';
import { Types } from 'mongoose';
import Like from '../../../models/Like';
import { TokenPayload } from '../../../lib/token';

export const listPosts: Middleware = async (ctx: Context) => {
  interface QuerySchema {
    cursor?: string;
  }
  const { cursor } = ctx.request.query as QuerySchema;
  if (cursor && !Types.ObjectId.isValid(cursor)) {
    ctx.status = 400;
    ctx.body = {
      name: 'Not ObjectId',
    };
    return;
  }

  try {
    const query = Object.assign(
      {},
      cursor
        ? {
            _id: {
              $lt: Types.ObjectId(cursor),
            },
          }
        : {}
    );
    const posts: any[] = await Post.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
    ])
      .match(query)
      .sort({ _id: -1 })
      .limit(10)
      .exec();

    const next = posts.length === 10 ? `/post/list/public?cursor=${posts[9]._id}` : null;
    const postWithData = posts
      .map(post => {
        const { _id: postId, title, body, post_thumbnail, tags: tag, info, user, createdAt } = post;
        return {
          postId,
          post_thumbnail,
          title,
          body,
          createdAt,
          tag,
          info: {
            ...pick(info, ['likes', 'comments']),
          },
          user: {
            ...pick(user, ['_id']),
            ...pick(user.profile, ['username', 'thumbnail', 'shortBio']),
          },
        };
      })
      .map(post => ({
        ...post,
        body: formatShortDescription(post.body, 'markdown'),
      }));

    ctx.type = 'application/json';
    ctx.body = {
      next,
      postWithData,
    };
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const userPostsList: Middleware = async (ctx: Context) => {
  interface ParamShema {
    username: string;
  }
  interface QuerySchema {
    cursor?: string;
  }
  const { username } = ctx.params as ParamShema;
  const { cursor } = ctx.request.query as QuerySchema;

  if (username && checkEmpty(username)) {
    ctx.status = 400;
    ctx.body = {
      name: 'INVALID_USERNAME',
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
    const userEists = await User.findOne({
      'profile.username': username,
    }).exec();
    if (!userEists) {
      ctx.status = 404;
      ctx.body = {
        name: 'NOT_FOUND_USER',
      };
      return;
    }

    const query = Object.assign(
      {},
      cursor
        ? {
            $and: [
              {
                _id: { $lt: Types.ObjectId(cursor) },
              },
              {
                'user.profile.username': userEists.profile.username,
              },
            ],
          }
        : {
            'user.profile.username': userEists.profile.username,
          }
    );

    const posts: any[] = await Post.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
    ])
      .match(query)
      .sort({ _id: -1 })
      .limit(10)
      .exec();

    const next = posts.length === 10 ? `/post/list/@${username}?cursor=${posts[9]._id}` : null;
    const postWithData = posts
      .map(post => {
        const { _id: postId, title, body, post_thumbnail, tags: tag, info, user, createdAt } = post;
        return {
          postId,
          post_thumbnail,
          title,
          body,
          createdAt,
          tag,
          info: {
            ...pick(info, ['likes', 'comments']),
          },
          user: {
            ...pick(user, ['_id']),
            ...pick(user.profile, ['username', 'thumbnail', 'shortBio']),
          },
        };
      })
      .map(post => ({
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

export const trendingPostList: Middleware = async (ctx: Context) => {
  interface QuerySchema {
    cursor: string | null;
  }

  const { cursor } = ctx.query as QuerySchema;
  if (cursor && !Types.ObjectId.isValid(cursor)) {
    ctx.status = 400;
    ctx.body = {
      name: 'Not ObjectId',
    };
    return;
  }

  try {
    const query = Object.assign(
      {},
      cursor
        ? {
            _id: {
              $lt: Types.ObjectId(cursor),
            },
          }
        : {}
    );
    const posts = await Post.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
    ])
      .match(query)
      .sort({ 'info.score': -1 })
      .limit(10)
      .exec();

    const next = posts.length === 10 ? `/post/list/trending?cursor=${posts[9]._id}` : null;
    const postWithData = posts
      .map(post => {
        const { _id: postId, title, body, post_thumbnail, tags: tag, info, user, createdAt } = post;
        return {
          postId,
          post_thumbnail,
          title,
          body,
          createdAt,
          tag,
          info: {
            ...pick(info, ['likes', 'comments']),
          },
          user: {
            ...pick(user, ['_id']),
            ...pick(user.profile, ['username', 'thumbnail', 'shortBio']),
          },
        };
      })
      .map(post => ({
        ...post,
        body: formatShortDescription(post.body, 'markdown'),
      }));

    ctx.type = 'application/json';
    ctx.body = {
      next,
      postWithData,
    };
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const listSequences: Middleware = async (ctx: Context) => {
  interface QuerySchema {
    postId: string;
  }

  const { postId } = ctx.query as QuerySchema;

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

    ctx.type = 'application/json';
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
    const userEists = await User.findByEmailOrUsername(null, username);
    if (!userEists) {
      ctx.status = 404;
      ctx.body = {
        name: 'User',
        payload: '유저가 존재하지 않습니다.',
      };
      return;
    }

    const query = Object.assign(
      {},
      cursor
        ? {
            $and: [
              {
                _id: { $lt: Types.ObjectId(cursor) },
              },
              {
                user: Types.ObjectId(userEists._id),
              },
            ],
          }
        : { user: Types.ObjectId(userEists._id) }
    );

    const posts = await Like.find(query)
      .populate({
        path: 'post',
        populate: {
          path: 'user',
          select: 'profile',
        },
      })
      .select('post')
      .sort({ _id: -1 })
      .limit(10)
      .exec();

    const next = posts.length === 10 ? `/post/list/likes/${username}?cursor=${posts[9]._id}` : null;
    const postWithData = posts
      .map(post => {
        const {
          _id: postId,
          title,
          body,
          post_thumbnail,
          tags: tag,
          info,
          user,
          createdAt,
        } = post.post;
        return {
          postId,
          post_thumbnail,
          title,
          body,
          createdAt,
          tag,
          info: {
            ...pick(info, ['likes', 'comments']),
          },
          user: {
            ...pick(user, ['_id']),
            ...pick(user.profile, ['username', 'thumbnail', 'shortBio']),
          },
        };
      })
      .map(post => ({
        ...post,
        body: formatShortDescription(post.body, 'markdown'),
      }));
    ctx.type = 'application/json';
    ctx.body = {
      next,
      postWithData,
    };
  } catch (e) {
    ctx.throw(500, e);
  }
};

////////////////////////
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

    ctx.type = 'application/json';
    ctx.body = {
      posts: serialized,
    };
  } catch (e) {
    ctx.throw(500, e);
  }
};
