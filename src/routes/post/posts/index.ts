import * as Router from 'koa-router';
import * as postsCtrl from './posts.ctrl';
import post from '..';

const posts = new Router();

posts.get('/@:username', postsCtrl.listPosts);
posts.get('/public', postsCtrl.listPosts);
posts.get('/trending', postsCtrl.trendingPostList);
posts.get('/sequences', postsCtrl.listSequences);

export default posts;
