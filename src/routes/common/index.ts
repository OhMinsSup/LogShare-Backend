import * as Router from 'koa-router';
import follow from './follow';
import tag from './tag';
import user from './user';

const common = new Router();

common.use('/follow', follow.routes());
common.use('/tags', tag.routes());
common.use('/user', user.routes());

export default common;
