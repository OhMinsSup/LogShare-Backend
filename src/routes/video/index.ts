import * as Router from 'koa-router';
import * as videoCtrl from './video.ctrl';
import {
  needsAuth,
  checkObjectId,
  checkVideoExistancy,
} from '../../lib/common';
import videos from './videos';
import likes from './like';
import comments from './comment';

const video = new Router();

video.post('/', needsAuth, videoCtrl.createVideo);
video.put('/:id', needsAuth, checkObjectId, videoCtrl.updateVideo);
video.delete('/:id', needsAuth, checkObjectId, videoCtrl.deleteVideo);
video.get('/:id', checkObjectId, videoCtrl.viewVideo);

video.use('/list', videos.routes());
video.use(
  '/:id/like',
  needsAuth,
  checkObjectId,
  checkVideoExistancy,
  likes.routes()
);
video.use(
  '/:id/comment',
  needsAuth,
  checkObjectId,
  checkVideoExistancy,
  comments.routes()
);
export default video;
