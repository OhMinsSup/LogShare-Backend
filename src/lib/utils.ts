import * as crypto from 'crypto';
import { Types } from 'mongoose';
import { Context, Middleware } from 'koa';
import Post, { IPost } from '../models/Post';
import { IUser } from '../models/User';
const removeMd = require('remove-markdown');

export const filterUnique = (array: string[]): string[] => {
  return [...new Set(array)];
};

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

export function checkEmpty(text: string) {
  if (!text) return true;
  const replaced = text
    .trim()
    .replace(/([\u3164\u115F\u1160\uFFA0\u200B\u0001-\u0008\u000B-\u000C\u000E-\u001F]+)/g, '');
  if (replaced === '') return true;
  return false;
}

export function formatShortDescription(value: string, type: 'markdown' | 'text'): string {
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

export const hash = (value: string): string => {
  if (!value) return null;
  return crypto
    .createHmac('sha256', 'ds')
    .update(value)
    .digest('hex');
};

export const checkObjectId: Middleware = async (ctx: Context, next: () => Promise<any>) => {
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

export const needsAuth: Middleware = async (ctx: Context, next: () => Promise<any>) => {
  const user = ctx.state.user;
  if (!user) {
    ctx.status = 403;
    return;
  }
  return next();
};

export const convertToFeed = (post: IPost) => {
  const {
    profile: { username },
  } = post.user;
  const link = `https://logshare.netlify.com/${post._id}`;
  return {
    link,
    title: post.title,
    description: post.body || formatShortDescription(post.body, 'markdown'),
    id: link,
    image: post.post_thumbnail,
    date: post.createdAt,
    author: [
      {
        name: username,
        link: `https://logshare.netlify.com/@${username}`,
      },
    ],
  };
};

export const normalize = (array: any[], key: string) => {
  const byId = {};
  const allIds = [];
  array.forEach(item => {
    byId[item[key]] = item;
    allIds.push(byId[item[key]]);
  });

  return allIds;
};

export const parserImage = (src: string, video_type: string, img_type: string) => {
  let splitUrl = src.split(video_type).concat(img_type);
  return splitUrl[0] + splitUrl[1] + splitUrl[2];
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
