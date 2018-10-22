import * as Router from 'koa-router';
import auth from './auth';
import post from './post';
import common from './common';

const router = new Router();

router.use('/auth', auth.routes());
router.use('/post', post.routes());
router.use('/common', common.routes());

export default router;
