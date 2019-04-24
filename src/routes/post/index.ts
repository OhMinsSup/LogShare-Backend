import * as Router from 'koa-router';
import * as postCtrl from './post.ctrl';
import { needsAuth } from '../../lib/utils';
import posts from './posts';
import like from './like';
import comment from './comment';

const post = new Router();

post.post('/', needsAuth, postCtrl.writePost);
post.put(
  '/:postId',
  needsAuth,
  postCtrl.checkPostObjectId,
  postCtrl.checkPostExistancy,
  postCtrl.checkPostOwnership,
  postCtrl.updatePost
);
post.delete(
  '/:postId',
  needsAuth,
  postCtrl.checkPostObjectId,
  postCtrl.checkPostExistancy,
  postCtrl.checkPostOwnership,
  postCtrl.deletePost
);

post.get('/:postId', postCtrl.checkPostObjectId, postCtrl.readPost);

post.use('/list', posts.routes());

post.use(
  '/:postId/like',
  needsAuth,
  postCtrl.checkPostObjectId,
  postCtrl.checkPostExistancy,
  like.routes()
);

post.use(
  '/:postId/comment',
  postCtrl.checkPostObjectId,
  postCtrl.checkPostExistancy,
  comment.routes()
);

export default post;
