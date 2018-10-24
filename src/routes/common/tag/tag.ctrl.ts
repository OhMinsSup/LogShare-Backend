import { Context, Middleware } from 'koa';
import PostTag from '../../../models/PostTag';
import { serializeTag, serializeTagPost } from '../../../lib/serialized';
import Tag from '../../../models/Tag';
import { formatShortDescription } from '../../../lib/common';

export const getTags: Middleware = async (ctx: Context): Promise<any> => {
  try {
    const tagData = await PostTag.aggregate([
      {
        $group: {
          _id: '$tag',
          tag: { $first: '$tag' },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'tags',
          localField: 'tag',
          foreignField: '_id',
          as: 'tag_docs',
        },
      },
      { $unwind: '$tag_docs' },
    ]).exec();

    ctx.body = tagData.map(serializeTag);
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const getTagInfo: Middleware = async (ctx: Context): Promise<any> => {
  type ParamsPayload = {
    tag: string;
  };

  type QueryPayload = {
    cursor: string | null;
  };

  const { tag }: ParamsPayload = ctx.params;
  const { cursor }: QueryPayload = ctx.query;

  try {
    const tagName = await Tag.findByTagName(tag);

    const query = Object.assign(
      {},
      cursor
        ? {
            _id: {
              $lt: cursor,
            },
            tag: tagName._id,
          }
        : {
            tag: tagName._id,
          }
    );

    const post = await PostTag.find(query)
      .select('post')
      .populate({
        path: 'post',
        populate: {
          path: 'user',
          select: 'profile',
        },
      })
      .limit(10)
      .exec();

    if (post.length === 0 || !post) {
      ctx.body = {
        next: '',
        postWithData: [],
      };
      return;
    }

    const next =
      post.length === 10 ? `/common/tags/${name}?cursor=${post[9]._id}` : null;

    ctx.body = {
      next,
      postWithData: post.map(serializeTagPost).map(post => ({
        ...post,
        body: formatShortDescription(post.body, 'text'),
      })),
    };
  } catch (e) {
    ctx.throw(500, e);
  }
};
