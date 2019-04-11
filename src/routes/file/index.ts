import * as Router from 'koa-router';
import * as fileCtrl from './file.ctrl';
import { needsAuth } from '../../lib/utils';

const file = new Router();

file.post('/create-url/post-images', needsAuth, fileCtrl.createPostImageSignedUrl);
file.post('/create-url/thumbnail', needsAuth, fileCtrl.createCommonThumbnailSignedUrl);
file.post('/create-url/cover', needsAuth, fileCtrl.createCommonUserCoverBgSignedUrl);

export default file;
