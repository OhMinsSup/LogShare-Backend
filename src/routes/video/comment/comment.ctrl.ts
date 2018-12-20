import { Middleware, Context } from 'koa';
import * as Joi from 'joi';
import VideoComment from '../../../models/VideoComment';
import Video from '../../../models/Video';
import { checkEmpty } from '../../../lib/common';
import { Types } from 'mongoose';

export const writeComment: Middleware = async (ctx: Context) => {
  type BodySchema = {
    text: string;
  };

  const schema = Joi.object().keys({
    text: Joi.string().required(),
  });

  const result = Joi.validate(ctx.request.body, schema);

  if (result.error) {
    ctx.status = 404;
    ctx.body = result.error;
    return;
  }

  const { text }: BodySchema = ctx.request.body;
  const videoId: string = ctx['video']._id;
  const userId: string = ctx['user']._id;

  if (checkEmpty(text)) {
    ctx.status = 400;
    ctx.body = {
      name: 'INVALID_TEXT',
    };
    return;
  }

  try {
    const comment = await new VideoComment({
      video: videoId,
      user: userId,
      text,
    }).save();

    if (!comment) {
      ctx.status = 404;
      ctx.body = {
        name: 'VideoComment',
        payload: '댓글이 존재하지 않습니다.',
      };
      return;
    }

    await Video.Count('comments', videoId);
    ctx.status = 204;
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const deleteComment: Middleware = async (ctx: Context) => {
  type ParamsPayload = {
    commentId: string;
  };

  const { commentId }: ParamsPayload = ctx.params;
  const videoId: string = ctx['video']._id;

  if (!Types.ObjectId.isValid(commentId)) {
    ctx.status = 400;
    ctx.body = {
      name: 'id 유효성',
      payload: '오브젝트 id가 아닙니다',
    }; // 400 Bad Request
    return;
  }

  try {
    const comment = await VideoComment.findById(commentId)
      .lean()
      .exec();

    if (!comment) {
      ctx.status = 404;
      ctx.body = {
        name: '존재하지않는 댓글은 삭제할 수 없습니다.',
      };
      return;
    }

    await Video.unCount('comments', videoId);
    await VideoComment.deleteOne({
      $and: [
        {
          _id: commentId,
          video: videoId,
        },
      ],
    })
      .lean()
      .exec();
    ctx.body = 204;
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const updateComment: Middleware = async (ctx: Context) => {
  type BodySchema = {
    text: string;
  };

  type ParamsPayload = {
    commentId: string;
  };

  const schema = Joi.object().keys({
    text: Joi.string().required(),
  });

  const result = Joi.validate(ctx.request.body, schema);

  if (result.error) {
    ctx.status = 404;
    ctx.body = result.error;
    return;
  }

  const { text }: BodySchema = ctx.request.body;
  const { commentId }: ParamsPayload = ctx.params;

  if (!Types.ObjectId.isValid(commentId)) {
    ctx.status = 400;
    ctx.body = {
      name: 'id 유효성',
      payload: '오브젝트 id가 아닙니다',
    }; // 400 Bad Request
    return;
  }

  if (checkEmpty(text)) {
    ctx.status = 400;
    ctx.body = {
      name: 'INVALID_TEXT',
    };
    return;
  }

  try {
    const comment = await VideoComment.findByIdAndUpdate(
      commentId,
      {
        text,
      },
      { new: true }
    )
      .lean()
      .exec();

    if (!comment) {
      ctx.status = 404;
      ctx.body = {
        name: 'VideoComment',
        payload: '댓글이 업데이트되지 않았습니다.',
      };
      return;
    }

    ctx.status = 204;
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const getCommentList: Middleware = async (ctx: Context) => {
  const videoId: string = ctx['video']._id;

  try {
    const comments = await VideoComment.getCommentList(videoId);

    ctx.body = {
      commentWithData: comments.map(comment => {
        const {
          text,
          createdAt,
          _id,
          user: { profile },
        } = comment;
        return {
          _id,
          text,
          createdAt,
          profile,
        };
      }),
    };
  } catch (e) {
    ctx.throw(500, e);
  }
};
