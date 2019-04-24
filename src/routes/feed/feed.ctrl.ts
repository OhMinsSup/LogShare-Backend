import { Context, Middleware } from 'koa';
import { Types } from 'mongoose';
import PostFeeds from '../../models/PostFeeds';

export const privateFeedUsers: Middleware = async (ctx: Context) => {
  interface FeedsData {
    _id: any;
    result: {
      _id: any;
      profile: {
        username: string;
        thumbnail: string;
        cover: string;
        shortBio: string;
      };
    };
  }

  const user = ctx.state.user;
  try {
    const feed: FeedsData[] = await PostFeeds.aggregate([
      {
        $match: {
          $and: [
            {
              user: Types.ObjectId(user._id),
            },
          ],
        },
      },
      // posts 스키마를 가져온다.
      {
        $lookup: {
          from: 'posts',
          localField: 'feed_post',
          foreignField: '_id',
          as: 'feed_post',
        },
      },
      { $unwind: '$feed_post' },
      // 유저 _id 관련 유저 정보 불러오기
      {
        $lookup: {
          from: 'posts',
          let: {
            feed_post_user: '$feed_post.user',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$user', '$$feed_post_user'],
                },
              },
            },
          ],
          as: 'feed',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'feed.user',
          foreignField: '_id',
          as: 'feed',
        },
      },
      {
        $unwind: '$feed',
      },
      {
        $project: {
          user: 1,
          feed: 1,
        },
      },
      {
        $group: {
          _id: '$feed._id',
          result: {
            $first: '$feed',
          },
        },
      },
      // 랜덤하게 보여준다
      {
        $sample: {
          size: 10,
        },
      },
    ])
      .limit(15)
      .exec();

    ctx.body = {
      feed: feed
        .map(f => {
          const {
            result: { _id: userId, profile },
          } = f;
          return {
            userId,
            profile,
          };
        })
        .filter(f => f.userId.toString() !== user._id.toString()),
    };
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const privateFeedPosts: Middleware = async (ctx: Context) => {
  interface FeedsData {
    _id: any;
    result: {
      _id: any;
      user: any;
      post_thumbnail: string;
      title: string;
      body: string;
      tags: string[];
      info: {
        likes: number;
        comments: number;
        score: number;
      };
      createdAt: Date;
      updatedAt: Date;
    };
  }

  const user = ctx.state.user;

  try {
    const feed: FeedsData[] = await PostFeeds.aggregate([
      {
        $match: {
          user: Types.ObjectId(user._id),
        },
      },
      // posts 스키마를 가져온다.
      {
        $lookup: {
          from: 'posts',
          localField: 'feed_post',
          foreignField: '_id',
          as: 'feed_post',
        },
      },
      { $unwind: '$feed_post' },
      // 태그 관련 또는 유저 _id 관련 포스트 불러오기
      {
        $lookup: {
          from: 'posts',
          let: {
            feed_post_tags: '$feed_post.tags',
            feed_post_user: '$feed_post.user',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    {
                      $eq: ['$tags', '$$feed_post_tags'],
                    },
                    {
                      $eq: ['$user', '$$feed_post_user'],
                    },
                  ],
                },
              },
            },
          ],
          as: 'feed',
        },
      },
      {
        $unwind: '$feed',
      },
      {
        $project: {
          user: 1,
          feed: 1,
        },
      },
      {
        $group: {
          _id: '$feed._id',
          result: {
            $first: '$feed',
          },
        },
      },
      // 랜덤하게 보여준다
      {
        $sample: {
          size: 10,
        },
      },
    ])
      .limit(15)
      .exec();

    ctx.body = {
      feed: feed
        .map(f => {
          const {
            result: { title, tags, _id, user, info, post_thumbnail },
          } = f;
          return {
            postId: _id,
            userId: user,
            post_thumbnail,
            title,
            tags,
            info,
          };
        })
        .filter(f => f.userId.toString() !== user._id.toString()),
    };
  } catch (e) {
    ctx.throw(500, e);
  }
};
