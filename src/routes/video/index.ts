import * as Router from 'koa-router';
import * as videoCtrl from './video.ctrl';
import { needsAuth } from '../../lib/common';

const video = new Router();

video.post('/', needsAuth, videoCtrl.createVideo);

export default video;
