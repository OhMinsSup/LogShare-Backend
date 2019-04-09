import * as Router from 'koa-router';
import * as commonCtrl from './common.ctrl';
import { needsAuth } from '../../lib/utils';

const common = new Router();

common.post('/profile-links', needsAuth, commonCtrl.updateProfileLinks);
common.get('/profile-info', needsAuth, commonCtrl.getProfileInfo);
common.post('/email-permission', needsAuth, commonCtrl.updateEmailPermissions);
common.post('/send-emails', commonCtrl.sendEmails);

export default common;
