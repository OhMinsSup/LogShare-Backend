import * as Router from 'koa-router';
import * as fileCtrl from './file.ctrl';
import { needsAuth } from '../../lib/common';

const file = new Router();

file.post(
  '/create-url/post-images',
  needsAuth,
  fileCtrl.createPostImageSignedUrl
);

file.post(
  '/create-url/common-cover-background',
  needsAuth,
  fileCtrl.createCommonUserCoverBgSignedUrl
);

file.post(
  '/create-url/common-thumbnail',
  needsAuth,
  fileCtrl.createCommonThumbnailSignedUrl
);

file.post(
  '/create-url/video-upload',
  needsAuth,
  fileCtrl.createVideoUploadSignedUrl
);

file.post(
  '/create-url/video-thumbnail',
  needsAuth,
  fileCtrl.createVideoThumbnailSignedUrl
);

export default file;
