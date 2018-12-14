import * as Router from 'koa-router';
import * as videoCtrl from './video.ctrl';
import { needsAuth, checkObjectId } from '../../lib/common';
import videos from './videos';

const video = new Router();

video.post('/', needsAuth, videoCtrl.createVideo);
video.put('/:id', needsAuth, checkObjectId, videoCtrl.updateVideo);
video.delete('/:id', needsAuth, checkObjectId, videoCtrl.deleteVideo);
video.get('/:id', checkObjectId, videoCtrl.viewVideo);

video.use('/list', videos.routes());

export default video;
