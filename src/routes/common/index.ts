import * as Router from 'koa-router';
import follow from './follow';
import tag from './tag';
import user from './user';
import notice from './notice';
import search from './search';
import rss from './rss';

const common = new Router();

common.use('/follow', follow.routes());
common.use('/tags', tag.routes());
common.use('/search', search.routes());
common.use('/user', user.routes());
common.use('/notice', notice.routes());
common.use('/rss', rss.routes());

export default common;
