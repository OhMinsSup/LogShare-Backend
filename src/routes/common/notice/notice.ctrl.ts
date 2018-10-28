import { Middleware, Context } from 'koa';
import { TokenPayload } from '../../../lib/token';
import Notice from '../../../models/Notice';
import { serializeNoticeRoom } from '../../../lib/serialized';
import * as Joi from 'joi';
import Follow from '../../../models/Follow';
import { filterUnique } from '../../../lib/common';
import NoticeMessage from '../../../models/NoticeMessage';
import { Types } from 'mongoose';

/**
 * @description 알림방을 만들거나, 알림방을 체크하는 api
 * @return {Promise<any>}
 * @param {Context} ctx koa Context
 */
export const checkNoticeRoom: Middleware = async (
  ctx: Context
): Promise<any> => {
  const userId: TokenPayload = ctx['user'];

  try {
    const exists = await Notice.findOne({
      creator: userId,
    })
      .populate({
        path: 'creator',
        select: 'username profile.username profile.thumbnail',
      })
      .lean()
      .exec();

    if (exists) {
      ctx.body = {
        noticeWithData: serializeNoticeRoom(exists),
      };
      return;
    }

    const notice = await new Notice({
      creator: userId,
    }).save();

    const noticeData = await Notice.findById(notice._id)
      .populate({
        path: 'creator',
        select: 'username profile.displayName profile.thumbnail',
      })
      .lean()
      .exec();

    ctx.body = {
      noticeWithData: serializeNoticeRoom(noticeData),
    };
  } catch (e) {
    ctx.throw(500, e);
  }
};

/**
 * @description follower, following 유저에게 메세지를 보내는 api
 * @return {Promise<any>}
 * @param {Context} ctx koa Context
 */
export const sendMessage: Middleware = async (ctx: Context): Promise<any> => {
  type BodySchema = {
    message: string;
  };

  const schema = Joi.object().keys({
    message: Joi.string().required(),
  });

  const result = Joi.validate(ctx.request.body, schema);

  if (result.error) {
    ctx.status = 404;
    ctx.body = result.error;
    return;
  }

  const { message }: BodySchema = ctx.request.body;
  const {
    _id: userId,
    profile: { username },
  }: TokenPayload = ctx['user'];
  let userIds: string[] = [];

  try {
    const following = await Follow.find({
      follower: userId,
    })
      .lean()
      .exec();

    const follower = await Follow.find({
      following: userId,
    })
      .lean()
      .exec();

    if (
      (!following || following.length === 0) &&
      (!follower || follower.length === 0)
    ) {
      ctx.status = 204;
      return;
    }

    // 팔로우, 팔로잉 유저의 아이디를 가져와 userIds에 저장
    following.map(user => userIds.push(user.following));
    follower.map(user => userIds.push(user.follower));

    const uniqueUserIds = filterUnique(userIds);

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
          .lean()
          .exec();
      })
    );

    if (notice.length === 0 || !notice) {
      ctx.status = 204;
      return;
    }

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

    ctx.status = 204;
  } catch (e) {
    ctx.throw(500, e);
  }
};

/**
 * @description 알림방에 속한 메세지를 리스팅해주는 api
 * @return {Promise<any>}
 * @param {Context} ctx koa Context
 */
export const listNotice: Middleware = async (ctx: Context): Promise<any> => {
  type QueryPayload = {
    cursor: string | null;
  };

  const { _id: userId }: TokenPayload = ctx['user'];
  const { cursor }: QueryPayload = ctx.query;

  if (!Types.ObjectId.isValid(cursor) && cursor) {
    ctx.status = 400;
    ctx.body = {
      name: 'Not ObjectId',
    };
    return;
  }

  try {
    const notice = await Notice.findOne({ creator: userId })
      .lean()
      .exec();

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
      cursor
        ? { _id: { $lt: cursor }, notice: notice._id }
        : { notice: notice._id }
    );

    const message = await NoticeMessage.find(query)
      .populate('sender')
      .limit(10)
      .sort({ _id: -1 })
      .lean()
      .exec();

    if (message.length === 0 || !message) {
      ctx.body = {
        next: '',
        message: [],
      };
      return;
    }

    const next =
      message.length === 10 ? `/common/notice?cursor=${message[9]._id}` : null;

    ctx.body = {
      next,
      message: message.map(m => {
        const { message, sender } = m;
        return {
          message,
          thumbnail: sender.profile.thumbnail,
        };
      }),
    };
  } catch (e) {
    ctx.throw(500, e);
  }
};
