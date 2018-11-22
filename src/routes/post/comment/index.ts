import * as Router from 'koa-router';
import * as commentCtrl from './comment.ctrl';

const comment = new Router();

comment.post('/', commentCtrl.writeComment);
comment.put('/:commentId', commentCtrl.updateComment);
comment.delete('/:commentId', commentCtrl.deleteComment);
comment.get('/', commentCtrl.getCommentList);
comment.get('/:commentId/reply', commentCtrl.getReplyComment);

export default comment;
