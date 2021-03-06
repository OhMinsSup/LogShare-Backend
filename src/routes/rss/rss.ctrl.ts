import { Context, Middleware } from 'koa';
import { Feed } from 'feed';
import Post from '../../models/Post';
import User from '../../models/User';
import { convertToFeed, checkEmpty } from '../../lib/utils';

export const getEntireRSS: Middleware = async (ctx: Context) => {
  try {
    const posts = await Post.find()
      .limit(20)
      .sort({ _id: -1 })
      .populate('user')
      .exec();

    const feed = new Feed({
      id: 'https://logshare.netlify.com/',
      title: 'LogShare',
      description: '블로그 서비스',
      link: 'https://logshare.netlify.com/',
      feed: 'https://logshare.netlify.com/',
      feedLinks: {
        json: 'https://logshare.netlify.com/json',
        atom: 'https://logshare.netlify.com/atom',
      },
      copyright: 'All rights reserved 2018, veloss',
    });

    const feeds = posts.map(convertToFeed);
    feeds.forEach(f => {
      feed.addItem(f);
    });

    ctx.type = 'text/xml; charset=UTF-8';
    ctx.body = feed.atom1();
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const getUserRSS: Middleware = async (ctx: Context) => {
  type ParamsPayload = {
    username: string;
  };

  const { username }: ParamsPayload = ctx.params;

  if (checkEmpty(username)) {
    ctx.status = 400;
    ctx.body = {
      name: 'INVALID_NAME',
    };
    return;
  }

  try {
    const user = await User.findByEmailOrUsername('username', username);

    if (!user) {
      ctx.status = 404;
      ctx.body = {
        name: 'User',
        payload: '유저가 존재하지 않습니다.',
      };
      return;
    }
    const posts = await Post.find({
      user: user._id,
    })
      .limit(20)
      .sort({ _id: -1 })
      .populate('user')
      .exec();

    const feed = new Feed({
      id: `https://logshare.netlify.com/@${user.profile.username}`,
      title: `LogShare/@${user.profile.username}`,
      description: `${user.profile.shortBio}`,
      link: `https://logshare.netlify.com/@${user.profile.username}`,
      feed: `https://logshare.netlify.com/@${user.profile.username}`,
      feedLinks: {
        json: `https://logshare.netlify.com/@${user.profile.username}/json`,
        atom: `https://logshare.netlify.com/@${user.profile.username}/atom`,
      },
      copyright: 'All rights reserved 2018, veloss',
    });

    const feeds = posts.map(convertToFeed);
    feeds.forEach(f => {
      feed.addItem(f);
    });

    ctx.type = 'text/xml; charset=UTF-8';
    ctx.body = feed.atom1();
  } catch (e) {
    ctx.throw(500, e);
  }
};
