import * as Joi from 'joi';
import { Types } from 'mongoose';
import { Middleware, Context } from 'koa';
import { pick } from 'lodash';
import Comment from '../../../models/Comment';
import { checkEmpty } from '../../../lib/utils';

export const writeComment: Middleware = async (ctx: Context) => {
  interface BodySchema {
    text: string;
    reply: string | null;
  }

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

  const { text, reply } = ctx.request.body as BodySchema;

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
    return;
  }

  const postData = ctx.state.post;
  const userData = ctx.state.user;
  let level = 0;
  let reply_to;

  try {
    if (reply) {
      const c = await Comment.findOne({ $and: [{ _id: reply }, { post: postData._id }] }).exec();

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

    new Comment({
      post: postData._id,
      user: userData._id,
      text,
      level,
      reply: reply_to,
    }).save();

    ctx.type = 'application/json';
    ctx.status = 200;

    setImmediate(() => {
      ctx.state.post.comments(true);
      ctx.state.post.count(3);
    });
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const updateComment: Middleware = async (ctx: Context) => {
  interface ParamSchema {
    commentId: string;
  }

  interface BodySchema {
    text: string;
  }

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

  const post = ctx.state.post;
  const { text } = ctx.request.body as BodySchema;
  const { commentId } = ctx.params as ParamSchema;

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
    return;
  }

  try {
    await Comment.findOneAndUpdate(
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
    ).exec();

    ctx.type = 'application/json';
    ctx.status = 200;
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const deleteComment: Middleware = async (ctx: Context) => {
  interface ParamSchema {
    commentId: string;
  }

  const post = ctx.state.post;
  const { commentId } = ctx.params as ParamSchema;

  if (!Types.ObjectId.isValid(commentId)) {
    ctx.status = 400;
    ctx.body = {
      name: 'Not ObjectId',
    };
    return;
  }

  try {
    const c = await Comment.findOne({ _id: commentId }).exec();

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
    ).exec();

    ctx.type = 'application/json';
    ctx.status = 200;
    setImmediate(() => {
      ctx.state.post.comments(false);
      ctx.state.post.count(-3);
    });
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const getCommentList: Middleware = async (ctx: Context) => {
  const post = ctx.state.post;
  try {
    const comments: any[] = await Comment.aggregate([
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
      .match({
        $and: [{ post: Types.ObjectId(post._id) }, { level: 0 }],
      })
      .sort({ _id: -1 })
      .exec();

    ctx.type = 'application/json';
    ctx.body = comments.map(comment => {
      const { level, visible, _id, user, text, createdAt } = comment;
      return {
        _id,
        visible,
        level,
        text,
        createdAt,
        user: {
          ...pick(user, ['_id']),
          ...pick(user.profile, ['thumbnail', 'shortBio', 'cover', 'username']),
        },
      };
    });
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const getReplyComment: Middleware = async (ctx: Context) => {
  interface ParamSchema {
    commentId: string;
  }

  const post = ctx.state.post;
  const { commentId } = ctx.params as ParamSchema;

  if (!Types.ObjectId.isValid(commentId)) {
    ctx.status = 400;
    ctx.body = {
      name: 'Not ObjectId',
    };
    return;
  }

  try {
    const comments: any[] = await Comment.aggregate([
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
      .match({
        $and: [{ post: Types.ObjectId(post._id) }, { reply: Types.ObjectId(commentId) }],
      })
      .sort({ _id: -1 })
      .exec();

    ctx.type = 'application/json';
    ctx.body = comments.map(comment => {
      const { level, visible, _id, user, text, createdAt } = comment;
      return {
        _id,
        visible,
        level,
        text,
        createdAt,
        user: {
          ...pick(user, ['_id']),
          ...pick(user.profile, ['thumbnail', 'shortBio', 'cover', 'username']),
        },
      };
    });
  } catch (e) {
    ctx.throw(500, e);
  }
};
