import * as crypto from 'crypto';
import { Types } from 'mongoose';
import { Context, Middleware } from 'koa';
import removeMd from 'remove-markdown';
import { TokenPayload } from './token';
import Post from '../models/Post';
import { IUser } from '../models/User';

/**
 * @description 중복된 데이터 없에는 함수
 * @param {string[]} array
 * @returns {string[]} array
 */
export const filterUnique = (array: string[]): string[] => {
  return [...new Set(array)];
};

/**
 * @description 문자가 공백인지 아닌지 체크
 * @param {string} text
 * @returns {boolean}
 */
export function checkEmpty(text: string) {
  if (!text) return true;
  const replaced = text
    .trim()
    .replace(
      /([\u3164\u115F\u1160\uFFA0\u200B\u0001-\u0008\u000B-\u000C\u000E-\u001F]+)/g,
      ''
    );
  if (replaced === '') return true;
  return false;
}

/**
 * @description 마크다운 또는 일반 텍스트문자를 제거하고 글자수가 200자 이상이면  나머지 문자를 생략하고 ...으로 교체
 * @param {string} markdown
 * @param {string} type
 * @returns {string}
 */
export function formatShortDescription(
  value: string,
  type: 'markdown' | 'text'
): string {
  let replaced = '';
  if (type === 'markdown') {
    replaced = value.replace(/\n/g, ' ').replace(/```(.*)```/g, '');
    return (
      removeMd(replaced)
        .slice(0, 200)
        .replace(/#/g, '') + (replaced.length > 200 ? '...' : '')
    );
  } else {
    replaced = value.replace(/\n/g, ' ');
    return replaced.slice(0, 200) + (replaced.length > 200 ? '...' : '');
  }
}

/**
 * @description 패스워드를 해시값으로 변경
 * @param {string} value
 * @returns {string} value
 */
export const hash = (value: string): string => {
  return crypto
    .createHmac('sha256', 'ds')
    .update(value)
    .digest('hex');
};

/**
 * @description id값이 오브젝트 id값인지 체크
 * @param {ctx} ctx koa Context
 * @param {() => Promise<any>} next
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
export const needsAuth: Middleware = async (
  ctx: Context,
  next: () => Promise<any>
) => {
  const user: TokenPayload = ctx['user'];

  if (!user) {
    ctx.status = 403;
    return;
  }

  return next();
};

/**
 * @description 포스트가 존재하는지 체크하는 미들웨어
 * @param {Context} ctx
 * @param {() => Promise<any>} next
 * @returns {() => Promise<any>} next()
 */
export const checkPostExistancy = async (
  ctx: Context,
  next: () => Promise<any>
) => {
  const { id } = ctx.params;

  try {
    const post = await Post.findById(id)
      .lean()
      .exec();

    if (!post) {
      ctx.status = 404;
      ctx.body = {
        name: '포스트',
        payload: '포스트가 존재하지 않습니다',
      };
    }

    ctx['post'] = post;
  } catch (e) {
    ctx.throw(500, e);
  }
  return next();
};

/**
 * @description 포스트의 타입을 가져온다
 */
export type PostPayload = {
  _id: string;
  user: IUser;
  post_thumbnail: string;
  title: string;
  body: string;
  info: {
    likes: number;
    comments: number;
    score: number;
  };
  createdAt: string;
  updatedAt: string;
};
