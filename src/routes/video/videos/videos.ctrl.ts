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

export const SideVideoList: Middleware = async (ctx: Context) => {
  try {
    const videos = await Video.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'users_docs',
        },
      },
      {
        $unwind: '$users_docs',
      },
      {
        $project: {
          video_thumbnail: 1,
          video_url: 1,
          title: 1,
          format: 1,
          description: 1,
          category: 1,
          play_time: 1,
          info: 1,
          createdAt: 1,
          'users_docs.profile': 1,
        },
      },
    ])
      .sample(20)
      .limit(20)
      .exec();

    const serialized = videos.map(video => {
      const {
        video_thumbnail,
        video_url,
        title,
        description,
        category,
        play_time,
        info,
        format,
        createdAt,
        users_docs: { profile },
      } = video;
      return {
        video_thumbnail,
        video_url,
        title,
        description,
        category,
        play_time,
        info,
        format,
        createdAt,
        profile,
      };
    });

    ctx.body = {
      videosWithData: serialized,
    };
  } catch (e) {
    ctx.throw(500, e);
  }
};
