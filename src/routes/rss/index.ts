import * as Router from 'koa-router';
import * as rssCtrl from './rss.ctrl';
import { needsAuth } from '../../lib/utils';

const rss = new Router();

rss.get('/', rssCtrl.getEntireRSS);
rss.get('/@:username', needsAuth, rssCtrl.getUserRSS);

export default rss;
