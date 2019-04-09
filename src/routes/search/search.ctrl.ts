import { Context, Middleware } from 'koa';
import { pick } from 'lodash';
import Post from '../../models/Post';
import { formatShortDescription } from '../../lib/utils';

export const publicSearch: Middleware = async (ctx: Context) => {
  interface QuerySchema {
    q: string;
    page: string;
  }
  const { q, page } = ctx.request.query as QuerySchema;
  const parsedPage = parseInt((page || 1) as any, 10);
  if (!q || isNaN(parsedPage)) {
    ctx.status = 400;
    return;
  }

  try {
    const [count, searchResult] = await Promise.all([
      Post.countSearchPosts(q),
      Post.searchPosts(q, parsedPage),
    ]);

    ctx.body = {
      parsedPage,
      count,
      searchResult: searchResult
        .map(search => {
          const {
            _id: postId,
            title,
            body,
            post_thumbnail,
            tags: tag,
            info,
            user,
            createdAt,
          } = search;
          return {
            postId,
            post_thumbnail,
            title,
            body,
            createdAt,
            tag,
            info: {
              ...pick(info, ['likes', 'comments']),
            },
            user: {
              ...pick(user, ['_id']),
              ...pick(user.profile, ['username', 'thumbnail', 'shortBio']),
            },
          };
        })
        .map(search => ({
          ...search,
          body: formatShortDescription(search.body, 'markdown'),
        })),
    };
  } catch (e) {
    ctx.throw(500, e);
  }
};
