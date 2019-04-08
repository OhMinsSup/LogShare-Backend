import * as Router from 'koa-router';
import auth from './auth';
import post from './post';
import common from './common';
import file from './file';
import notice from './notice';
import tag from './tag';
import user from './user';
import search from './search';
import rss from './rss';
import follow from './follow';

const router = new Router();

router.use('/auth', auth.routes());
router.use('/post', post.routes());
router.use('/file', file.routes());
router.use('/notice', notice.routes());
router.use('/tag', tag.routes());
router.use('/user', user.routes());
router.use('/search', search.routes());
router.use('/common', common.routes());
router.use('/rss', rss.routes());
router.use('/follow', follow.routes());

router.get('/', ctx => {
  ctx.type = 'application/json';
  ctx.body = {
    result: 'Hello',
  };
});

export default router;
