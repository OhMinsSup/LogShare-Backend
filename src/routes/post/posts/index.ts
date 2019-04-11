import * as Router from 'koa-router';
import * as postsCtrl from './posts.ctrl';

const posts = new Router();

posts.get('/@:username', postsCtrl.userPostsList);
posts.get('/public', postsCtrl.listPosts);
posts.get('/trending', postsCtrl.trendingPostList);
posts.get('/like/@:username', postsCtrl.likePostsList);
posts.get('/sequences', postsCtrl.listSequences);

/////////////////////////////////////
posts.get('/featured', postsCtrl.featuredPost);

export default posts;
