import * as Router from 'koa-router';
import * as likeCtrl from './like.ctrl';

const like = new Router();

like.post('/', likeCtrl.like);
like.delete('/', likeCtrl.unlike);

export default like;
