import * as Router from 'koa-router';
import * as activityCtrl from './activity.ctrl';
import { needsAuth } from '../../../lib/common';

const activity = new Router();

activity.get('/record/:name', needsAuth, activityCtrl.activityRecord);

export default activity;
