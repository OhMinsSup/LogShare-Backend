import * as Router from 'koa-router';
import * as commentCtrl from './comment.ctrl';
import { needsAuth } from '../../../lib/utils';

const comment = new Router();

comment.post('/', needsAuth, commentCtrl.writeComment);
comment.put('/:commentId', needsAuth, commentCtrl.updateComment);
comment.delete('/:commentId', needsAuth, commentCtrl.deleteComment);

comment.get('/', commentCtrl.getCommentList);
comment.get('/:commentId/reply', commentCtrl.getReplyComment);

export default comment;
