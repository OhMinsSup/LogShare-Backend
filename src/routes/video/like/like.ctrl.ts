import { Middleware, Context } from 'koa';
import VideoLike from '../../../models/VideoLike';
import Video from '../../../models/Video';

export const like: Middleware = async (ctx: Context) => {
  const videoId: string = ctx['video']._id;
  const userId: string = ctx['user']._id;

  try {
    const exists = await VideoLike.checkExists(userId, videoId);

    if (exists) {
      ctx.status = 409;
      ctx.body = {
        name: 'Like',
        payload: '이미 like 중입니다',
      };
      return;
    }

    await new VideoLike({
      user: userId,
      video: videoId,
    }).save();

    await Video.Count('likes', videoId);

    ctx.body = {
      liked: true,
      likes: (ctx['video'].info.likes + 1) as number,
    };

    await Video.findOneAndUpdate(
      {
        $and: [{ user: userId }, { _id: videoId }],
      },
      {
        $inc: { 'info.score': 5 },
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

export const unlike: Middleware = async (ctx: Context) => {
  const videoId: string = ctx['video']._id;
  const userId: string = ctx['user']._id;

  try {
    const exists = await VideoLike.checkExists(userId, videoId);

    if (!exists) {
      ctx.status = 409;
      ctx.body = {
        name: 'Like',
        payload: 'like를 하지 않았습니다',
      };
      return;
    }

    await VideoLike.deleteOne({
      $and: [
        {
          video: videoId,
          user: userId,
        },
      ],
    })
      .lean()
      .exec();

    await Video.unCount('likes', videoId);

    ctx.body = {
      liked: false,
      likes: (ctx['post'].info.likes - 1) as number,
    };

    await Video.findOneAndUpdate(
      {
        $and: [{ user: userId }, { _id: videoId }],
      },
      {
        $inc: { 'info.score': -5 },
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
