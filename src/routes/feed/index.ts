import * as Router from 'koa-router';
import * as feedCtrl from './feed.ctrl';
import { needsAuth } from '../../lib/utils';

const feed = new Router();

feed.get('/post/private', needsAuth, feedCtrl.privateFeedPosts);
feed.get('/user/private', needsAuth, feedCtrl.privateFeedUsers);

export default feed;
