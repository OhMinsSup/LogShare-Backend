import * as Router from 'koa-router';
import * as rssCtrl from './rss.ctrl';
import { needsAuth } from '../../../lib/common';

const rss = new Router();

rss.get('/', needsAuth, rssCtrl.getEntireRSS);
rss.get('/@:username', needsAuth, rssCtrl.getUserRSS);

export default rss;
