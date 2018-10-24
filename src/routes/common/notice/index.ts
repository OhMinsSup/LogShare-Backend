import * as Router from 'koa-router';
import * as noticeCtrl from './notice.ctrl';
import { needsAuth } from '../../../lib/common';

const notice = new Router();

notice.get('/', needsAuth, noticeCtrl.listNotice);
notice.post('/', needsAuth, noticeCtrl.checkNoticeRoom);
notice.post('/send-message', needsAuth, noticeCtrl.sendMessage);

export default notice;
