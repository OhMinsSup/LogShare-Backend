import * as Router from 'koa-router';
import auth from './auth';

const router = new Router();

router.use('/auth', auth.routes());

export default router;
