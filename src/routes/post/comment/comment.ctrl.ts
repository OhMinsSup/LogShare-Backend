import { Middleware, Context } from 'koa';
import * as Joi from 'joi';
import { checkEmpty, PostPayload } from '../../../lib/common';
import { Types } from 'mongoose';
import { TokenPayload } from '../../../lib/token';
import Comment, { IComment } from '../../../models/Comment';
import Post from '../../../models/Post';

/**
 * @description 댓글을 작성하는 api
 * @return {Promise<any>}
 * @param {Context} ctx koa Context
 */
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

  const { _id: postId, user }: PostPayload = ctx['post'];
  const { _id: userId }: TokenPayload = ctx['user'];
  let level = 0;
  let reply_to: IComment | string;

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

    await Post.Count('comments', postId);

    const commentWithData = await Comment.findById(comment._id)
      .lean()
      .exec();

    ctx.body = commentWithData;

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

/**
 * @description 댓글을 수정하는 api
 * @return {Promise<any>}
 * @param {Context} ctx koa Context
 */
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

/**
 * @description 댓글을 삭제하는 api(실제로 삭제하는 것이 아닌 데이터를 단순히 안보이게 한다)
 * @return {Promise<any>}
 * @param {Context} ctx koa Context
 */
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
    const c = await Comment.findById(commentId)
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
        visible: false,
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

/**
 * @description 0단 댓글 리스트를 보여주는 api
 * @return {Promise<any>}
 * @param {Context} ctx koa Context
 */
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
      .sort({ _id: -1 })
      .lean()
      .exec();

    ctx.body = comments;
  } catch (e) {
    ctx.throw(500, e);
  }
};

/**
 * @description 댓글의 댓글 리스트를 보여주는 api
 * @return {Promise<any>}
 * @param {Context} ctx koa Context
 */
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
      .sort({ _id: -1 })
      .lean()
      .exec();

    ctx.body = comments;
  } catch (e) {
    ctx.throw(500, e);
  }
};
