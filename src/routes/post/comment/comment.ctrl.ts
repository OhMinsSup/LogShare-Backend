import { Middleware, Context } from 'koa';
import * as Joi from 'joi';
import { checkEmpty, PostPayload } from '../../../lib/common';
import { Types } from 'mongoose';
import { TokenPayload } from '../../../lib/token';
import Comment from '../../../models/Comment';

export const writeComment: Middleware = async (ctx: Context): Promise<any> => {
  type BodySchema = {
    text: string;
    reply: string | null;
  };

  const schema = Joi.object().keys({
    text: Joi.string()
      .min(1)
      .required(),
    reply: Joi.string().allow(null),
  });

  const result = Joi.validate(ctx.request.body, schema);

  if (result.error) {
    ctx.status = 404;
    ctx.body = result.error;
    return;
  }

  const { text, reply }: BodySchema = ctx.request.body;

  if (checkEmpty(text)) {
    ctx.status = 400;
    ctx.body = {
      name: 'INVALID_TEXT',
    };
    return;
  }

  if (reply) {
    if (!Types.ObjectId.isValid(reply)) {
      ctx.status = 400;
      ctx.body = {
        name: 'Not ObjectId',
      };
      return; // 400 Bad Request
    }
  }

  const { _id: postId }: PostPayload = ctx['post'];
  const { _id: userId }: TokenPayload = ctx['user'];
  let level = 0;
  let reply_to;

  try {
    if (reply) {
      const c = await Comment.findById(reply).exec();

      if (!c) {
        ctx.status = 404;
        ctx.body = {
          name: 'Comment',
          payload: '댓글을 찾을 수 없습니다',
        };
        return;
      }

      level = c.level + 1;

      if (level === 3) {
        level = 2;
        reply_to = c.reply;

        ctx.body = {
          name: 'Comment',
          payload: '댓글 3단까지만 달 수 있습니다.',
        };
        return;
      } else {
        reply_to = reply;
      }
    }

    const comment = await new Comment({
      post: postId,
      user: userId,
      text,
      level,
      reply: reply_to,
    }).save();

    if (!comment) {
      ctx.status = 500;
      return;
    }

    const commentWithData = await Comment.findById(comment._id)
      .lean()
      .exec();

    ctx.body = commentWithData;
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const updateComment: Middleware = async (ctx: Context): Promise<any> => {
  type ParamsPayload = {
    commentId: string;
  };

  type BodySchema = {
    text: string;
  };

  const schema = Joi.object().keys({
    text: Joi.string()
      .min(1)
      .required(),
  });

  const result = Joi.validate(ctx.request.body, schema);

  if (result.error) {
    ctx.status = 404;
    ctx.body = result.error;
    return;
  }

  const post: PostPayload = ctx['post'];
  const { text }: BodySchema = ctx.request.body;
  const { commentId }: ParamsPayload = ctx.params;

  if (!Types.ObjectId.isValid(commentId)) {
    ctx.status = 400;
    ctx.body = {
      name: 'Not ObjectId',
    };
    return; // 400 Bad Request
  }

  try {
    const comment = await Comment.findOneAndUpdate(
      {
        $and: [
          {
            post: post._id,
            _id: commentId,
          },
        ],
      },
      {
        text,
      },
      {
        new: true,
      }
    )
      .lean()
      .exec();

    if (!comment) {
      ctx.status = 404;
      ctx.body = {
        name: 'Comment',
        payload: '댓글이 업데이트되지 않았습니다',
      };
      return;
    }

    ctx.body = comment;
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const deleteComment: Middleware = async (ctx: Context): Promise<any> => {
  type ParamsPayload = {
    commentId: string;
  };

  const post: PostPayload = ctx['post'];
  const { commentId }: ParamsPayload = ctx.params;

  if (!Types.ObjectId.isValid(commentId)) {
    ctx.status = 400;
    ctx.body = {
      name: 'Not ObjectId',
    };
    return; // 400 Bad Request
  }

  try {
    const c = await Comment.findById(commentId).exec();

    if (c.reply) {
      await Comment.deleteOne({
        $and: [
          {
            post: post._id,
            _id: commentId,
          },
        ],
      })
        .lean()
        .exec();
      await Comment.deleteMany({
        $and: [
          {
            post: post._id,
            reply: commentId,
          },
        ],
      })
        .lean()
        .exec();
    } else {
      await Comment.deleteOne({
        $and: [
          {
            post: post._id,
            _id: commentId,
          },
        ],
      });
    }

    ctx.status = 204;
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const getCommentList: Middleware = async (
  ctx: Context
): Promise<any> => {
  const post: PostPayload = ctx['post'];

  try {
    const comments = await Comment.find({
      post: post._id,
      level: 0,
    })
      .populate('user', 'profile')
      .lean()
      .exec();

    ctx.body = comments;
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const getReplyComment: Middleware = async (
  ctx: Context
): Promise<any> => {
  type ParamsPayload = {
    commentId: string;
  };

  const post: PostPayload = ctx['post'];
  const { commentId }: ParamsPayload = ctx.params;

  if (!Types.ObjectId.isValid(commentId)) {
    ctx.status = 400;
    ctx.body = {
      name: 'Not ObjectId',
    };
    return; // 400 Bad Request
  }

  try {
    const comments = await Comment.find({
      post: post._id,
      reply: commentId,
    })
      .populate('user', 'profile')
      .lean()
      .exec();

    ctx.body = comments;
  } catch (e) {
    ctx.throw(500, e);
  }
};
