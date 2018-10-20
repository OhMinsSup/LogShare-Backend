import * as crypto from 'crypto';
import { Types } from 'mongoose';
import { Context, Middleware } from 'koa';

/**
 * @description 패스워드를 해시값으로 변경
 * @param {string} password
 * @returns {string} password
 */
export const hash = (password: string): string => {
  return crypto
    .createHmac('sha256', 'ds')
    .update(password)
    .digest('hex');
};

/**
 * @description id값이 오브젝트 id값인지 체크
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns {NextFunction} next()
 */
export const checkObjectId: Middleware = async (
  ctx: Context,
  next: () => Promise<any>
) => {
  type ParamPayload = {
    id: string;
  };

  const { id }: ParamPayload = ctx.params;

  if (!Types.ObjectId.isValid(id)) {
    ctx.status = 400;
    ctx.body = {
      name: 'Not ObjectId',
    };
    return; // 400 Bad Request
  }
  return next();
};

/**
 * @description 로그인 체크
 * @param {Context} ctx
 * @param {() => Promise<any>} next
 * @returns {() => Promise<any>} next()
 */
export const needsAuth: Middleware = (
  ctx: Context,
  next: () => Promise<any>
) => {
  const user = ctx['user'];

  if (!user) {
    ctx.status = 409;
    return;
  }

  return next();
};
