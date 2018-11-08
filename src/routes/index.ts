import * as Router from 'koa-router';
import auth from './auth';
import post from './post';
import common from './common';
import file from './file';
import series from './series';

const router = new Router();

router.use('/auth', auth.routes());
router.use('/post', post.routes());
router.use('/file', file.routes());
router.use('/common', common.routes());
router.use('/series', series.routes());

export default router;
