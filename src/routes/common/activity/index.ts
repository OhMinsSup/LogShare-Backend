import * as Router from 'koa-router';
import * as activityCtrl from './activity.ctrl';
import { needsAuth } from '../../../lib/common';

const activity = new Router();

activity.get('/history/:name', needsAuth, activityCtrl.userHistory);

export default activity;
