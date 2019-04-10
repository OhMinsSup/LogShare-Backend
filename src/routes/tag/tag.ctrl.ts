import { Context, Middleware } from 'koa';
import { pick } from 'lodash';
import Post from '../../models/Post';
import { formatShortDescription, checkEmpty } from '../../lib/utils';

export const getTagInfo: Middleware = async (ctx: Context) => {
  interface ParamSchema {
    tag: string;
  }
  interface QuerySchema {
    cursor: string | null;
  }

  const { tag } = ctx.params as ParamSchema;
  if (checkEmpty(tag)) {
    ctx.status = 400;
    ctx.body = {
      name: 'INVALID_TAG',
    };
    return;
  }

  const { cursor } = ctx.query as QuerySchema;
  const query = Object.assign(
    {},
    cursor
      ? {
          $and: [
            {
              _id: {
                $lt: cursor,
              },
            },
            {
              tags: tag,
            },
          ],
        }
      : {
          tags: tag,
        }
  );
  try {
    const posts: any[] = await Post.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
    ])
      .match(query)
      .sort({ _id: 1 })
      .limit(10)
      .exec();

    const next = posts.length === 10 ? `/tag/${tag}?cursor=${posts[9]._id}` : null;
    ctx.type = 'application/json';
    ctx.body = {
      next,
      postWithData: posts
        .map(post => {
          const {
            _id: postId,
            post_thumbnail,
            tags: tag,
            info,
            title,
            body,
            user,
            createdAt,
          } = post;
          return {
            postId,
            title,
            body,
            tag,
            post_thumbnail,
            createdAt,
            info: {
              ...pick(info, ['likes', 'comments']),
            },
            user: {
              ...pick(user, ['_id']),
              ...pick(user.profile, ['username', 'thumbnail', 'shortBio']),
            },
          };
        })
        .map(post => ({
          ...post,
          body: formatShortDescription(post.body, 'markdown'),
        })),
    };
  } catch (e) {
    ctx.throw(500, e);
  }
};
