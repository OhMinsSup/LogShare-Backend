import { Middleware, Context } from 'koa';
import * as Joi from 'joi';
import { TokenPayload } from '../../../lib/token';
import { checkEmpty, formatShortDescription } from '../../../lib/common';
import PostSave from '../../../models/PostSave';
import { Types } from 'mongoose';

export const temporaryPost: Middleware = async (ctx: Context): Promise<any> => {
  type BodySchema = {
    title: string;
    body: string;
  };

  const schema = Joi.object().keys({
    title: Joi.string()
      .min(1)
      .required(),
    body: Joi.string()
      .min(1)
      .required(),
  });

  const result = Joi.validate(ctx.request.body, schema);

  if (result.error) {
    ctx.status = 404;
    ctx.body = result.error;
    return;
  }

  const { title, body }: BodySchema = ctx.request.body;
  const user: TokenPayload = ctx['user'];

  const stringToCheck = [title, body];

  for (let i of stringToCheck) {
    if (checkEmpty(i)) {
      ctx.status = 400;
      ctx.body = {
        name: 'INVALID_TEXT',
      };
      return;
    }
  }

  try {
    await new PostSave({
      user: user._id,
      title,
      body,
    }).save();

    ctx.status = 204;
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const deleteTempPost: Middleware = async (
  ctx: Context
): Promise<any> => {
  type ParamsPayload = {
    id: string;
  };

  const { id }: ParamsPayload = ctx.params;
  const user: TokenPayload = ctx['user'];

  try {
    await PostSave.deleteOne({
      $and: [{ user: user._id }, { _id: id }],
    })
      .lean()
      .exec();

    ctx.status = 204;
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const temporaryReadPost: Middleware = async (
  ctx: Context
): Promise<any> => {
  type ParamsPayload = {
    id: string;
  };

  const { id }: ParamsPayload = ctx.params;

  try {
    const temp = await PostSave.findById(id)
      .lean()
      .exec();

    if (!temp) {
      ctx.status = 404;
      ctx.body = {
        name: 'Temp',
        payload: '임시 저장 포스트가 존재하지 않습니다',
      };
      return;
    }

    ctx.body = temp;
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const temporaryPostsList: Middleware = async (
  ctx: Context
): Promise<any> => {
  type QueryPayload = {
    cursor: string | null;
  };

  const { cursor }: QueryPayload = ctx.query;

  if (cursor && !Types.ObjectId.isValid(cursor)) {
    ctx.status = 400;
    ctx.body = {
      name: 'Not ObjectId',
    };
    return;
  }

  try {
    const temps = await PostSave.temporaryPostsList(cursor);

    if (temps.length === 0 || !temps) {
      ctx.body = {
        next: '',
        postWithData: [],
      };
      return;
    }

    const next =
      temps.length === 10 ? `/post/save?cursor=${temps[9]._id}` : null;

    const tempWithData = temps
      .map(temp => {
        const { title, body } = temp;
        return {
          title,
          body,
        };
      })
      .map(t => ({
        ...t,
        body: formatShortDescription(t.body, 'text'),
      }));

    ctx.body = {
      next,
      tempWithData,
    };
  } catch (e) {
    ctx.throw(500, e);
  }
};
