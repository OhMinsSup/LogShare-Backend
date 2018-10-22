import * as Router from 'koa-router';
import * as postCtrl from './post.ctrl';
import { needsAuth, checkObjectId, checkPostExistancy } from '../../lib/common';
import posts from './posts';
import like from './like';
import comment from './comment';

const post = new Router();

post.post('/', needsAuth, postCtrl.writePost);
post.put('/:id', needsAuth, checkObjectId, postCtrl.updatePost);
post.delete('/:id', needsAuth, checkObjectId, postCtrl.deletePost);
post.get('/:id', needsAuth, checkObjectId, postCtrl.readPost);

post.use('/list', needsAuth, posts.routes());
post.use(
  '/like/:id',
  needsAuth,
  checkObjectId,
  checkPostExistancy,
  like.routes()
);
post.use(
  '/comment/:id',
  needsAuth,
  checkObjectId,
  checkPostExistancy,
  comment.routes()
);

export default post;
