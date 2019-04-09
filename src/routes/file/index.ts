import * as Router from 'koa-router';
import * as fileCtrl from './file.ctrl';
import { needsAuth } from '../../lib/utils';

const file = new Router();

file.post('/create-url/post-images', needsAuth, fileCtrl.createPostImageSignedUrl);

file.post(
  '/create-url/common-cover-background',
  needsAuth,
  fileCtrl.createCommonUserCoverBgSignedUrl
);

file.post('/create-url/common-thumbnail', needsAuth, fileCtrl.createCommonThumbnailSignedUrl);

export default file;
