import { Middleware, Context } from 'koa';
import * as Joi from 'joi';
import { checkEmpty, filterUnique } from '../../lib/common';
import Video from '../../models/Video';
import { TokenPayload } from '../../lib/token';

export const createVideo: Middleware = async (ctx: Context) => {
  type BodySchema = {
    video_thumbnail: string;
    title: string;
    description: string | null;
    tags: string[];
    url: string;
  };

  const schema = Joi.object().keys({
    video_thumbnail: Joi.string().uri(),
    title: Joi.string()
      .min(1)
      .required(),
    description: Joi.string()
      .min(1)
      .allow(null),
    url: Joi.string()
      .uri()
      .required(),
    tags: Joi.array().items(Joi.string()),
  });

  const result = Joi.validate(ctx.request.body, schema);

  if (result.error) {
    ctx.status = 404;
    ctx.body = result.error;
    return;
  }

  const {
    title,
    description,
    video_thumbnail,
    tags,
    url,
  }: BodySchema = ctx.request.body;

  const stringsToCheck = [title, url, video_thumbnail, ...tags];

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
  const user: TokenPayload = ctx['user'];

  try {
    const video = await new Video({
      user: user._id,
      title,
      description,
      video_thumbnail,
      tags: uniqueTags,
      url,
    }).save();

    if (!video) {
      ctx.status = 404;
      ctx.body = {
        name: 'Post',
        payload: '포스트가 만들어지지 않았습니다',
      };
      return;
    }

    ctx.body = {
      videoId: video._id,
    };
  } catch (e) {
    ctx.throw(500, e);
  }
};
