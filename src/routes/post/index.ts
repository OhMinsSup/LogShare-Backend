import * as Router from 'koa-router';
import * as postCtrl from './post.ctrl';
import { needsAuth, checkObjectId } from '../../lib/common';

const post = new Router();

post.post('/', needsAuth, postCtrl.writePost);
post.put('/:id', needsAuth, checkObjectId, postCtrl.updatePost);
post.delete('/:id', needsAuth, checkObjectId, postCtrl.deletePost);
post.get('/:id', needsAuth, checkObjectId, postCtrl.readPost);

export default post;
