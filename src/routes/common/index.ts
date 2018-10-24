import * as Router from 'koa-router';
import follow from './follow';
import tag from './tag';
import user from './user';
import activity from './activity';

const common = new Router();

common.use('/follow', follow.routes());
common.use('/tags', tag.routes());
common.use('/user', user.routes());
common.use('/activity', activity.routes());

export default common;
