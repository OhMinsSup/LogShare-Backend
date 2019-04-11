import * as Joi from 'joi';
import { Middleware, Context } from 'koa';
import { Types } from 'mongoose';
import { pick } from 'lodash';
import Notice from '../../models/Notice';
import Follow from '../../models/Follow';
import NoticeMessage from '../../models/NoticeMessage';
import { filterUnique, getToDayDate } from '../../lib/utils';

function serializeNotice(data: any) {
  const { _id: noticeId, creator } = data;

  return {
    noticeId,
    creator: {
      ...pick(creator, ['_id']),
      ...pick(creator.profile, ['username', 'thumbnail', 'shortBio']),
    },
  };
}

export const checkNoticeRoom: Middleware = async (ctx: Context) => {
  const { _id: userId } = ctx.state.user;
  try {
    const exists = await Notice.findOne({
      creator: userId,
    })
      .populate({
        path: 'creator',
        select: 'username profile.username profile.thumbnail',
      })
      .exec();

    if (exists) {
      ctx.body = {
        noticeWithData: serializeNotice(exists),
      };
      return;
    }

    const notice = await Notice.create({
      creator: userId,
    });

    const noticeData = await Notice.findOne({ _id: notice._id })
      .populate({
        path: 'creator',
        select: 'username profile.displayName profile.thumbnail profile.shortBio',
      })
      .exec();

    ctx.type = 'application/json';
    ctx.body = {
      noticeWithData: serializeNotice(noticeData),
    };

    setImmediate(() => {
      NoticeMessage.create({
        sender: userId,
        recipient: userId,
        notice: notice._id,
        message: 'LogShare에 가입한 것을 환영합니다.',
      });
    });
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const sendMessage: Middleware = async (ctx: Context) => {
  interface BodySchema {
    message: string;
  }

  const schema = Joi.object().keys({
    message: Joi.string().required(),
  });

  const result = Joi.validate(ctx.request.body, schema);

  if (result.error) {
    ctx.status = 404;
    ctx.body = result.error;
    return;
  }

  const { message } = ctx.request.body as BodySchema;
  const { _id: userId } = ctx.state.user;

  try {
    const following = await Follow.find({
      follower: userId,
    }).exec();

    const follower = await Follow.find({
      following: userId,
    }).exec();

    if ((!following || following.length === 0) && (!follower || follower.length === 0)) {
      ctx.status = 204;
      return;
    }

    // 팔로우, 팔로잉 유저 정보를 가져오고 중복된 id값을 제거
    const f1 = following.map(user => user.following.toString());
    const f2 = follower.map(user => user.follower.toString());

    const results = f1.concat(f2);

    const uniqueUserIds = filterUnique(results);

    if (!uniqueUserIds || uniqueUserIds.length === 0) {
      ctx.status = 204;
      return;
    }

    // 각 아이디의 notice를 찾아서 온다
    const notice = await Promise.all(
      uniqueUserIds.map(userId => {
        return Notice.findOne({ creator: userId })
          .populate({
            path: 'creator',
            select: 'profile.username profile.thumbnail',
          })
          .exec();
      })
    );

    await Promise.all(
      notice.map(notice => {
        const m = new NoticeMessage({
          sender: userId,
          recipient: notice.creator._id,
          notice: notice._id,
          message: message,
        }).save();
        return m;
      })
    );

    ctx.type = 'application/json';
    ctx.status = 200;
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const alreadyListNotice: Middleware = async (ctx: Context) => {
  const { _id: userId } = ctx.state.user;

  try {
    const notice = await Notice.findOne({
      creator: userId,
    }).exec();
    if (!notice) {
      ctx.status = 404;
      ctx.body = {
        name: 'Notice',
        payload: '알림방이 존재하지 않습니다',
      };
      return;
    }

    const { startDate, endDate } = getToDayDate();
    const message = await NoticeMessage.find({
      $and: [
        { notice: notice._id },
        {
          createdAt: {
            $gte: startDate,
            $lt: endDate,
          },
        },
      ],
    })
      .populate('sender')
      .exec();

    ctx.type = 'application/json';
    ctx.body = {
      message: message.map(m => {
        const { message, sender, createdAt } = m;
        return {
          message,
          thumbnail: sender.profile.thumbnail,
          username: sender.profile.username,
          createdAt,
        };
      }),
    };
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const listNotice: Middleware = async (ctx: Context) => {
  interface QuerySchema {
    cursor: string | null;
  }

  const { _id: userId } = ctx.state.user;
  const { cursor } = ctx.query as QuerySchema;
  if (cursor && !Types.ObjectId.isValid(cursor)) {
    ctx.status = 400;
    ctx.body = {
      name: 'Not ObjectId',
    };
    return;
  }

  try {
    const notice = await Notice.findOne({ creator: userId }).exec();

    if (!notice) {
      ctx.status = 404;
      ctx.body = {
        name: 'Notice',
        payload: '알림방이 존재하지 않습니다',
      };
      return;
    }

    const query = Object.assign(
      {},
      cursor ? { _id: { $lt: cursor }, notice: notice._id } : { notice: notice._id }
    );

    const message = await NoticeMessage.find(query)
      .populate('sender')
      .limit(20)
      .sort({ _id: -1 })
      .exec();

    const next = message.length === 20 ? `/notice?cursor=${message[19]._id}` : null;

    ctx.type = 'application/json';
    ctx.body = {
      next,
      message: message.map(m => {
        const { message, sender, createdAt } = m;
        return {
          message,
          thumbnail: sender.profile.thumbnail,
          username: sender.profile.username,
          createdAt,
        };
      }),
    };
  } catch (e) {
    ctx.throw(500, e);
  }
};
