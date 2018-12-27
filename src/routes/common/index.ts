import * as Router from 'koa-router';
import * as commonCtrl from './common.ctrl';
import follow from './follow';
import tag from './tag';
import user from './user';
import notice from './notice';
import search from './search';
import rss from './rss';
import { needsAuth } from '../../lib/common';

const common = new Router();

common.post('/profile-links', needsAuth, commonCtrl.updateProfileLinks);
common.get('/profile-info', needsAuth, commonCtrl.getProfileInfo);
common.post('/email-permission', needsAuth, commonCtrl.updateEmailPermissions);
common.post('/send-emails', commonCtrl.sendEmails);
common.post('/send-email', commonCtrl.sendEmail);

common.use('/follow', follow.routes());
common.use('/tags', tag.routes());
common.use('/search', search.routes());
common.use('/user', user.routes());
common.use('/notice', notice.routes());
common.use('/rss', rss.routes());

export default common;
