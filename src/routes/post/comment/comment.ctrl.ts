import { Middleware, Context } from 'koa';
import * as Joi from 'joi';
import { checkEmpty, PostPayload } from '../../../lib/common';
import { Types } from 'mongoose';
import { TokenPayload } from '../../../lib/token';
import Comment, { IComment } from '../../../models/Comment';
import Post from '../../../models/Post';

export const writeComment: Middleware = async (ctx: Context) => {
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

  if (reply && !Types.ObjectId.isValid(reply)) {
    ctx.status = 400;
    ctx.body = {
      name: 'Not ObjectId',
    };
    return; // 400 Bad Request
  }

  const { _id: postId, user }: PostPayload = ctx['post'];
  const { _id: userId }: TokenPayload = ctx['user'];
  let level = 0;
  let reply_to: IComment | string;

  try {
    if (reply) {
      const c: IComment = await Comment.findById(reply)
        .lean()
        .exec();

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

    await Post.Count('comments', postId);

    ctx.type = 'application/json';
    ctx.status = 200;

    await Post.findOneAndUpdate(
      {
        $and: [{ user }, { _id: postId }],
      },
      {
        $inc: { 'info.score': 2 },
      },
      {
        new: true,
      }
    )
      .lean()
      .exec();
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const updateComment: Middleware = async (ctx: Context) => {
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

  if (checkEmpty(text)) {
    ctx.status = 400;
    ctx.body = {
      name: 'INVALID_TEXT',
    };
    return;
  }

  if (!Types.ObjectId.isValid(commentId)) {
    ctx.status = 400;
    ctx.body = {
      name: 'Not ObjectId',
    };
    return; // 400 Bad Request
  }

  try {
    const comment: IComment = await Comment.findOneAndUpdate(
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

    ctx.type = 'application/json';
    ctx.status = 200;
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const deleteComment: Middleware = async (ctx: Context) => {
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
    const c: IComment = await Comment.findById(commentId)
      .lean()
      .exec();

    if (!c) {
      ctx.status = 404;
      ctx.body = {
        name: 'Comment',
        payload: '댓글이 존재하지 않습니다.',
      };
      return;
    }

    await Comment.findOneAndUpdate(
      {
        $and: [
          {
            post: post._id,
            _id: c._id,
          },
        ],
      },
      {
        visible: true,
      },
      {
        new: true,
      }
    )
      .lean()
      .exec();

    await Post.unCount('comments', post._id);
    ctx.status = 204;
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const getCommentList: Middleware = async (ctx: Context) => {
  const post: PostPayload = ctx['post'];

  try {
    const comments: IComment[] = await Comment.find(
      {
        post: post._id,
        level: 0,
      },
      {
        text: true,
        level: true,
        visible: true,
        reply: true,
        createdAt: true,
        user: true,
      }
    )
      .populate('user', 'profile')
      .sort({ _id: -1 })
      .lean()
      .exec();

    ctx.type = 'application/json';
    ctx.body = comments;
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const getReplyComment: Middleware = async (ctx: Context) => {
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
    const comments: IComment[] = await Comment.find(
      {
        post: post._id,
        reply: commentId,
      },
      {
        text: true,
        level: true,
        reply: true,
        visible: true,
        createdAt: true,
        user: true,
      }
    )
      .populate('user', 'profile')
      .sort({ _id: -1 })
      .lean()
      .exec();

    ctx.type = 'application/json';
    ctx.body = comments;
  } catch (e) {
    ctx.throw(500, e);
  }
};
