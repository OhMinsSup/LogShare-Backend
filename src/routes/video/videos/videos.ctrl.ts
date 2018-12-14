import { Middleware, Context } from 'koa';
import { Types } from 'mongoose';
import { checkEmpty } from '../../../lib/common';
import User from '../../../models/User';
import Video from '../../../models/Video';
import { serializeVideo } from '../../../lib/serialized';

export const listVideos: Middleware = async (ctx: Context) => {
  type ParamPayload = {
    username: string | null;
  };

  type QueryPayload = {
    cursor: string | null;
  };

  const { username }: ParamPayload = ctx.params;
  const { cursor }: QueryPayload = ctx.query;

  if (cursor && !Types.ObjectId.isValid(cursor)) {
    ctx.status = 400;
    ctx.body = {
      name: 'Not ObjectId',
    };
    return;
  }

  let userId: string;

  try {
    if (username && !checkEmpty(username)) {
      let user = await User.findByEmailOrUsername('username', username);

      if (!user) {
        ctx.status = 404;
        ctx.body = {
          name: 'User',
          payload: '유저가 존재하지 않습니다.',
        };
        return;
      }

      userId = user._id;
    }

    const videos = await Video.listVideos(userId, cursor);

    if (videos.length === 0 || !videos) {
      ctx.body = {
        next: '',
        videosWithData: [],
      };
      return;
    }

    const next =
      videos.length === 10
        ? `/video/list/${username ? `@${username}` : `public`}?cursor=${
            videos[9]._id
          }`
        : null;

    ctx.body = {
      next,
      videosWithData: videos.map(video => serializeVideo(video)),
    };
  } catch (e) {
    ctx.throw(500, e);
  }
};
