import * as Joi from 'joi';
import { Middleware, Context } from 'koa';
import { Types } from 'mongoose';
import { pick } from 'lodash';
import User from '../../models/User';
import Like from '../../models/Like';
import PostRead from '../../models/PostRead';
import Post, { IPost } from '../../models/Post';
import { checkEmpty, filterUnique, hash } from '../../lib/utils';
import PostFeeds from '../../models/PostFeeds';
import Comment from '../../models/Comment';

export const checkPostExistancy: Middleware = async (ctx: Context, next: () => Promise<void>) => {
  interface CheckPostExistancyParamSchema {
    postId: string;
  }
  const { postId } = ctx.params as CheckPostExistancyParamSchema;
  try {
    const post = await Post.findOne({
      _id: postId,
    }).exec();
    if (!post) {
      ctx.status = 404;
      ctx.body = {
        name: 'POST_DATA_NOT_FOUND',
      };
      return;
    }
    ctx.state.post = post;
  } catch (e) {
    ctx.throw(500, e);
    return;
  }
  return next();
};

export const checkPostOwnership: Middleware = (ctx: Context, next: () => Promise<void>) => {
  const { user, post } = ctx.state;

  if (post.user.toString() !== user._id.toString()) {
    ctx.status = 403;
    ctx.body = {
      name: 'NO_PERMISSION',
    };
    return;
  }
  return next();
};

export const checkPostObjectId: Middleware = async (ctx: Context, next: () => Promise<void>) => {
  interface ParamSchema {
    postId: string;
  }
  const { postId } = ctx.params as ParamSchema;
  if (!Types.ObjectId.isValid(postId)) {
    ctx.status = 400;
    ctx.body = {
      name: 'Not ObjectId',
    };
    return;
  }
  return next();
};

export const writePost: Middleware = async (ctx: Context) => {
  type BodySchema = {
    title: string;
    body: string;
    post_thumbnail: string | null;
    tags: string[];
  };

  const schema = Joi.object().keys({
    title: Joi.string()
      .min(1)
      .required(),
    body: Joi.string()
      .min(1)
      .required(),
    post_thumbnail: Joi.string()
      .uri()
      .allow(null),
    tags: Joi.array().items(Joi.string()),
  });

  const result = Joi.validate(ctx.request.body, schema);

  if (result.error) {
    ctx.status = 404;
    ctx.body = result.error;
    return;
  }

  const { title, body, post_thumbnail, tags }: BodySchema = ctx.request.body;
  const user = ctx.state.user;

  const stringsToCheck = [title, body, ...tags];

  for (let i of stringsToCheck) {
    if (checkEmpty(i)) {
      ctx.status = 400;
      ctx.body = {
        name: 'INVALID_TEXT',
      };
      return;
    }
  }

  if (tags) {
    for (const key in tags) {
      if (key.length > 25) {
        ctx.status = 400;
        ctx.body = {
          name: 'TAG_TOO_LONG',
        };
        return;
      }
    }
  }

  const uniqueTags = filterUnique(tags);

  try {
    const post = await new Post({
      user: user._id,
      title,
      body,
      tags: uniqueTags,
      post_thumbnail: post_thumbnail === null || !post_thumbnail ? '' : post_thumbnail,
    }).save();

    if (!post) {
      ctx.status = 404;
      ctx.body = {
        name: 'Post',
        payload: '포스트가 만들어지지 않았습니다',
      };
      return;
    }

    ctx.type = 'application/json';
    ctx.body = {
      postId: post._id,
    };

    setImmediate(() => {
      User.findOne({
        _id: user._id,
      }).then(user => {
        if (!user) return;
        user.count('post', true);
      });
    });
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const updatePost: Middleware = async (ctx: Context) => {
  type BodySchema = {
    title: string;
    body: string;
    post_thumbnail: string | null;
    tags: string[];
  };

  const schema = Joi.object().keys({
    title: Joi.string()
      .min(1)
      .required(),
    body: Joi.string()
      .min(1)
      .required(),
    post_thumbnail: Joi.string()
      .uri()
      .allow(null),
    tags: Joi.array().items(Joi.string()),
  });

  const result = Joi.validate(ctx.request.body, schema);

  if (result.error) {
    ctx.status = 404;
    ctx.body = result.error;
    return;
  }

  const { title, body, post_thumbnail, tags }: BodySchema = ctx.request.body;

  const stringsToCheck = [title, body, ...tags];

  for (let i of stringsToCheck) {
    if (checkEmpty(i)) {
      ctx.status = 400;
      ctx.body = {
        name: 'INVALID_TEXT',
      };
      return;
    }
  }

  if (tags) {
    for (const key in tags) {
      if (key.length > 25) {
        ctx.status = 400;
        ctx.body = {
          name: 'TAG_TOO_LONG',
        };
        return;
      }
    }
  }

  const uniqueTags = filterUnique(tags);

  try {
    const post: IPost = await Post.findOneAndUpdate(
      {
        $and: [
          {
            _id: ctx.state.post._id,
          },
          {
            user: ctx.state.user._id,
          },
        ],
      },
      {
        title,
        body,
        tags: uniqueTags,
        post_thumbnail: !post_thumbnail ? '' : post_thumbnail,
      },
      {
        new: true,
      }
    ).exec();

    ctx.type = 'application/json';
    ctx.body = {
      postId: post._id,
    };
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const deletePost: Middleware = async (ctx: Context) => {
  const { user, post } = ctx.state;
  try {
    await Promise.all([
      Comment.deleteMany({
        post: post._id,
      }).exec(),
      Like.deleteMany({
        post: post._id,
      }).exec(),
      PostFeeds.deleteMany({
        feed_post: post._id,
      }).exec(),
    ]);
    await Post.deleteOne({
      $and: [{ _id: post._id }, { user: user._id }],
    }).exec();
    ctx.type = 'application/json';
    ctx.status = 200;

    setImmediate(() => {
      User.findOne({
        _id: user._id,
      }).then(user => {
        if (!user) return;
        user.count('post', false);
      });
    });
  } catch (e) {
    ctx.throw(500, e);
  }
};

function serializePost(data: any) {
  const {
    postData: { _id: postId, title, body, post_thumbnail, createdAt, user, info, tags: tag },
    liked,
  } = data;
  return {
    postId,
    title,
    body,
    liked,
    tag,
    post_thumbnail,
    createdAt,
    info: {
      ...pick(info, ['likes', 'comments']),
    },
    user: {
      ...pick(user, ['_id']),
      ...pick(user.profile, ['username', 'thumbnail', 'shortBio']),
    },
  };
}

export const readPost: Middleware = async (ctx: Context) => {
  interface ParamSchema {
    postId: string;
  }
  const { postId } = ctx.params as ParamSchema;
  const { user } = ctx.state;
  let liked = false;

  try {
    const postData = await Post.readPostById(postId);
    if (user) {
      const exists = await Like.checkExists(user._id, postId);
      liked = !!exists;
    }

    ctx.body = serializePost({ postData, liked });

    setImmediate(async () => {
      const hashIp = hash(ctx.request.ip);
      const postRead = await PostRead.view(hashIp, postData._id);
      if (postRead || !user) return;
      await PostRead.create({
        ip: hashIp,
        post: postData._id,
        user: user._id,
      });
      await postData.count(1);
      await PostFeeds.createPostFeed(user._id, postData._id);
    });
  } catch (e) {
    ctx.throw(500, e);
  }
};
