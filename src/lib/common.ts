import * as crypto from 'crypto';
import { Types } from 'mongoose';
import { Context, Middleware } from 'koa';
import { TokenPayload } from './token';
import Post, { IPost } from '../models/Post';
import { IUser } from '../models/User';
const removeMd = require('remove-markdown');

/**
 * @description 중복된 데이터 없에는 함수
 * @param {string[]} array
 * @returns {string[]} array
 */
export const filterUnique = (array: string[]): string[] => {
  return [...new Set(array)];
};

/**
 * @param {string} text
 * @returns {string} text
 */
export const escapeForUrl = (text: string): string => {
  if (!text) return null;
  return text
    .replace(
      /[^0-9a-zA-Zㄱ-힣.\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf -]/g,
      ''
    )
    .replace(/ /g, '-')
    .replace(/--+/g, '-');
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
 * @description 데이터 값을 해시값으로 변경
 * @param {string} value
 * @returns {string} value
 */
export const hash = (value: string): string => {
  if (!value) return null;
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
  type ParamsPayload = {
    id: string;
  };

  const { id }: ParamsPayload = ctx.params;

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
  type ParamsPayload = {
    id: string;
  };
  const { id }: ParamsPayload = ctx.params;

  try {
    const post: IPost = await Post.findById(id)
      .lean()
      .exec();

    if (!post) {
      ctx.status = 404;
      ctx.body = {
        name: '포스트',
        payload: '포스트가 존재하지 않습니다',
      };
      return;
    }

    (ctx['post'] as IPost) = post;
  } catch (e) {
    ctx.throw(500, e);
  }
  return next();
};

/**
 * @description 임시 저장 포스트가 존재하는지 체크하는 미들웨어
 * @param {Context} ctx
 * @param {() => Promise<any>} next
 * @returns {() => Promise<any>} next()
 */

/**
 * @description 데이터를 맵 배열 형태로 반환
 * @param {any[]} array
 * @param {string} key
 * @returns {any[]} allIds
 */
export const normalize = (array: any[], key: string) => {
  const byId = {};
  const allIds = [];
  array.forEach(item => {
    byId[item[key]] = item;
    allIds.push(byId[item[key]]);
  });

  return allIds;
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

/**
 * @description Rss에서 포스트의 내용을 rss에 필요한 값을 넘겨준다
 * @param {IPost} post
 */
export const convertToFeed = (post: IPost) => {
  const {
    profile: { username },
  } = post.user;
  const link = `http://localhost:4000/${post._id}`;
  return {
    link,
    title: post.title,
    description: post.body || formatShortDescription(post.body, 'text'),
    id: link,
    image: post.post_thumbnail,
    date: post.createdAt,
    author: [
      {
        name: username,
        link: `http://localhost:4000/@${username}`,
      },
    ],
  };
};

export const getToDayDate = () => {
  type TupleDateType = string | number;

  let today: string | Date = new Date();

  let month: TupleDateType = today.getUTCMonth() + 1;
  let day: TupleDateType = today.getUTCDate();
  let year: TupleDateType = today.getUTCFullYear();

  if (day < 10) {
    day = `0${day}`;
  }

  if (month < 10) {
    month = `0${month}`;
  }

  today = year + '-' + month + '-' + day;

  let startDate = today + 'T00:00:00.000Z';
  let endDate = today + 'T23:59:59.999Z';

  return {
    startDate,
    endDate,
  };
};
