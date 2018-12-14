import { Middleware, Context } from 'koa';
import * as Joi from 'joi';
import { checkEmpty, hash } from '../../lib/common';
import Video, { IVideo } from '../../models/Video';
import { TokenPayload } from '../../lib/token';
import VideoLike from '../../models/VideoLike';
import VideoRead from '../../models/VideoRead';
import { serializeVideo } from '../../lib/serialized';

export const createVideo: Middleware = async (ctx: Context) => {
  type BodySchema = {
    video_thumbnail: string;
    video_url: string;
    title: string;
    description: string | null;
    time: string;
    category: string;
  };

  const schema = Joi.object().keys({
    video_thumbnail: Joi.string().uri(),
    video_url: Joi.string()
      .uri()
      .required(),
    title: Joi.string()
      .min(1)
      .required(),
    description: Joi.string()
      .min(1)
      .allow(null),
    category: Joi.string()
      .valid(
        '개발',
        '사진',
        '비즈니스',
        '디자인',
        '음악',
        '자기개발',
        '사무',
        '생활',
        '기타'
      )
      .required(),
    time: Joi.string().required(),
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
    video_url,
    category,
    time,
  }: BodySchema = ctx.request.body;

  const stringsToCheck = [title, category, video_thumbnail, video_url, time];

  for (let i of stringsToCheck) {
    if (checkEmpty(i)) {
      ctx.status = 400;
      ctx.body = {
        name: 'INVALID_TEXT',
      };
      return;
    }
  }

  const user: TokenPayload = ctx['user'];

  try {
    const video = await new Video({
      user: user._id,
      title,
      description,
      video_thumbnail,
      video_url,
      category,
      play_time: time,
    }).save();

    if (!video) {
      ctx.status = 404;
      ctx.body = {
        name: 'Video',
        payload: '비디오가 만들어지지 않았습니다',
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

export const updateVideo: Middleware = async (ctx: Context) => {
  type ParamsPayload = {
    id: string;
  };

  type BodySchema = {
    video_thumbnail: string;
    video_url: string;
    title: string;
    description: string | null;
    time: string;
    category: string;
  };

  const schema = Joi.object().keys({
    video_thumbnail: Joi.string().uri(),
    video_url: Joi.string()
      .uri()
      .required(),
    title: Joi.string()
      .min(1)
      .required(),
    description: Joi.string()
      .min(1)
      .allow(null),
    category: Joi.string()
      .valid(
        '개발',
        '사진',
        '비즈니스',
        '디자인',
        '음악',
        '자기개발',
        '사무',
        '생활',
        '기타'
      )
      .required(),
    time: Joi.string().required(),
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
    video_url,
    category,
    time,
  }: BodySchema = ctx.request.body;
  const { id: videoId }: ParamsPayload = ctx.params;

  const stringsToCheck = [title, category, video_thumbnail, video_url, time];

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
    const video: IVideo = await Video.findByIdAndUpdate(
      videoId,
      {
        title,
        description,
        video_thumbnail,
        video_url,
        category,
        play_time: time,
      },
      {
        new: true,
      }
    )
      .lean()
      .exec();

    if (!video) {
      ctx.status = 404;
      ctx.body = {
        name: 'Video',
        payload: '비디오가 만들어지지 않았습니다',
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

export const deleteVideo: Middleware = async (ctx: Context) => {
  type ParamsPayload = {
    id: string;
  };

  const { id: videoId }: ParamsPayload = ctx.params;

  try {
    await Promise.all([]);

    await Video.deleteOne({ _id: videoId })
      .lean()
      .exec();

    ctx.status = 204;
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const viewVideo: Middleware = async (ctx: Context) => {
  type ParamsPayload = {
    id: string;
  };

  const { id }: ParamsPayload = ctx.params;
  const user: TokenPayload = ctx['user'];

  try {
    const video = await Video.viewVideoById(id);

    if (!video) {
      ctx.status = 404;
      return;
    }

    let liked = false;

    if (user) {
      const exists = await VideoLike.checkExists(user._id, video._id);
      liked = !!exists;
    }

    ctx.body = serializeVideo({
      ...video,
      liked,
    });

    const hashIp = hash(ctx.request.ip);
    const videoRead = await VideoRead.view(hashIp, video._id);

    if (videoRead) return;

    await new VideoRead({
      ip: hashIp,
      video: video._id,
      user: user._id,
    }).save();

    await Video.score(video.user, video._id);
  } catch (e) {
    ctx.throw(500, e);
  }
};
