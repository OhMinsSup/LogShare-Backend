import * as Router from 'koa-router';
import * as likeCtrl from './like.ctrl';

const like = new Router();

like.get('/:id', likeCtrl.getLike);
like.post('/:id', likeCtrl.like);
like.delete('/:id', likeCtrl.unlike);

export default like;
