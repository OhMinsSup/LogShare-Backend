import { Middleware, Context } from 'koa';
import * as Joi from 'joi';
import { Token } from '../../lib/token';
import { checkEmpty, filterUnique } from '../../lib/common';
import Tag from '../../models/Tag';
import Post from '../../models/Post';
import PostTag from '../../models/PostTag';
import User from '../../models/User';
import { serializePost } from '../../lib/serialized';
import Like from '../../models/Like';

/**
 * @description 포스트를 작성하기 위한 api
 * @return {Promise<any>}
 * @param {Context} ctx koa Context
 */
export const writePost: Middleware = async (ctx: Context) => {
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
  const user: Token = ctx['user'];

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

  const uniqueTags: string[] = filterUnique(tags);

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

    const postData = await Post.readPostById(post._id);

    if (!postData) {
      ctx.status = 404;
      ctx.body = {
        name: 'Post',
        payload: '포스트가 존재하지 않습니다.',
      };
      return;
    }

    ctx.body = serializePost(postData);
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const updatePost: Middleware = async (ctx: Context) => {};

export const deletePost: Middleware = async (ctx: Context) => {};

/**
 * @description 포스트를 읽기 위한 api
 * @return {Promise<any>}
 * @param {Context} ctx koa Context
 */
export const readPost: Middleware = async (ctx: Context) => {
  type ParamsPayload = {
    id: string;
  };

  const { id }: ParamsPayload = ctx.params;
  const user: Token = ctx['user'];

  try {
    const post = await Post.readPostById(id);

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
      liked,
    });
  } catch (e) {
    ctx.throw(500, e);
  }
};
