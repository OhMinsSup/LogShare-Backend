import * as Router from 'koa-router';
import auth from './auth';
import post from './post';
import common from './common';
import file from './file';
import video from './video';

const router = new Router();

router.use('/auth', auth.routes());
router.use('/post', post.routes());
router.use('/file', file.routes());
router.use('/common', common.routes());
router.use('/video', video.routes());

export default router;
