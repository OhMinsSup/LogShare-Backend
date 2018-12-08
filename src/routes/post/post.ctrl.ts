import { Middleware, Context } from 'koa';
import * as Joi from 'joi';
import { diff } from 'json-diff';
import { TokenPayload } from '../../lib/token';
import { checkEmpty, filterUnique, hash } from '../../lib/common';
import Tag from '../../models/Tag';
import Post, { IPost } from '../../models/Post';
import PostTag from '../../models/PostTag';
import User from '../../models/User';
import Like from '../../models/Like';
import { serializePost } from '../../lib/serialized';
import PostRead from '../../models/PostRead';
import Comment from '../../models/Comment';

/**
 * @description 포스트를 작성하기 위한 api
 * @return {Promise<any>}
 * @param {Context} ctx koa Context
 */
export const writePost: Middleware = async (ctx: Context): Promise<any> => {
  type BodySchema = {
    title: string;
    body: string;
    post_thumbnail: string | null;
    tags: string[] | null;
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
  const user: TokenPayload = ctx['user'];

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

  const uniqueTags = filterUnique(tags);

  try {
    const tagIds = await Promise.all(uniqueTags.map(tag => Tag.getTagId(tag)));

    const post = await new Post({
      user: user._id,
      title,
      body,
      post_thumbnail:
        post_thumbnail === null || !post_thumbnail ? '' : post_thumbnail,
    }).save();

    if (!post) {
      ctx.status = 404;
      ctx.body = {
        name: 'Post',
        payload: '포스트가 만들어지지 않았습니다',
      };
      return;
    }

    await PostTag.Link(post._id, tagIds);
    await User.Count('post', user._id);

    ctx.body = {
      postId: post._id,
    };
  } catch (e) {
    ctx.throw(500, e);
  }
};

/**
 * @description 포스트를 수정하기 위한 api
 * @return {Promise<any>}
 * @param {Context} ctx koa Context
 */
export const updatePost: Middleware = async (ctx: Context): Promise<any> => {
  type BodySchema = {
    title: string;
    body: string;
    post_thumbnail: string | null;
    tags: string[] | null;
  };

  type ParamsPayload = {
    id: string;
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
  const { id: postId }: ParamsPayload = ctx.params;

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

  try {
    const currentTags = await PostTag.getTagNames(postId);
    const tagNames = currentTags.map(tag => tag.tag.name);
    const tagDiff: string[] = diff(tagNames.sort(), tags.sort()) || [];
    const tagsToRemove: string[] = tagDiff
      .filter(info => info[0] === '-')
      .map(info => info[1]);
    const tagsToAdd: string[] = tagDiff
      .filter(info => info[0] === '+')
      .map(info => info[1]);

    await PostTag.removeTagsPost(postId, tagsToRemove);
    await PostTag.addTagsToPost(postId, tagsToAdd);

    const post: IPost = await Post.findByIdAndUpdate(
      postId,
      {
        title,
        body,
        post_thumbnail:
          post_thumbnail === null || !post_thumbnail ? '' : post_thumbnail,
      },
      {
        new: true,
      }
    )
      .lean()
      .exec();

    if (!post) {
      ctx.status = 404;
      ctx.body = {
        name: 'Post',
        payload: '포스트가 업데이트되지 않았습니다',
      };
      return;
    }

    ctx.body = {
      postId: post._id as string,
    };
  } catch (e) {
    ctx.throw(500, e);
  }
};

/**
 * @description 포스트를 삭제하기 위한 api
 * @return {Promise<any>}
 * @param {Context} ctx koa Context
 */
export const deletePost: Middleware = async (ctx: Context): Promise<any> => {
  type ParamsPayload = {
    id: string;
  };

  const { id: postId }: ParamsPayload = ctx.params;

  try {
    await Promise.all([
      PostTag.deleteMany({ post: postId })
        .lean()
        .exec(),
      Like.deleteMany({ post: postId })
        .lean()
        .exec(),
      Comment.deleteMany({ post: postId })
        .lean()
        .exec(),
      PostRead.deleteOne({ post: postId })
        .lean()
        .exec(),
    ]);

    await Post.deleteOne({ _id: postId })
      .lean()
      .exec();
    await User.unCount('post', ctx['user']._id);

    ctx.status = 204;
  } catch (e) {
    ctx.throw(500, e);
  }
};

/**
 * @description 포스트를 읽기 위한 api
 * @return {Promise<any>}
 * @param {Context} ctx koa Context
 */
export const readPost: Middleware = async (ctx: Context): Promise<any> => {
  type ParamsPayload = {
    id: string;
  };

  const { id }: ParamsPayload = ctx.params;
  const user: TokenPayload = ctx['user'];

  try {
    const post = await Post.readPostById(id);
    const tag = await PostTag.getTagNames(id);

    if (!post) {
      ctx.status = 404;
      return;
    }

    let liked = false;

    if (user) {
      const exists = await Like.checkExists(user._id, post._id);
      liked = !!exists;
    }

    ctx.body = serializePost({
      ...post,
      name: tag.map(tag => tag.tag.name),
      liked,
    });

    const hashIp = hash(ctx.request.ip);
    const postRead = await PostRead.view(hashIp, post._id);

    if (postRead) return;

    await new PostRead({
      ip: hashIp,
      post: post._id,
      user: user._id,
    }).save();

    await Post.score(post.user, post._id);
  } catch (e) {
    ctx.throw(500, e);
  }
};
