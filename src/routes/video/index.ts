import * as Router from 'koa-router';
import * as videoCtrl from './video.ctrl';
import { needsAuth, checkObjectId } from '../../lib/common';

const video = new Router();

video.post('/', needsAuth, videoCtrl.createVideo);
video.get('/:id', checkObjectId, videoCtrl.viewVideo);

export default video;
