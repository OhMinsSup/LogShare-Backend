import * as Router from 'koa-router';
import * as postsCtrl from './posts.ctrl';

const posts = new Router();

posts.get('/@:username', postsCtrl.listPosts);
posts.get('/public', postsCtrl.listPosts);
posts.get('/trending', postsCtrl.trendingPostList);
posts.get('/sequences', postsCtrl.listSequences);
posts.get('/likes/@:username', postsCtrl.likePostsList);

export default posts;
