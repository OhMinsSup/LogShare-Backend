import * as Router from 'koa-router';
import * as followCtrl from './follow.ctrl';
import { needsAuth } from '../../../lib/common';

const follow = new Router();

follow.get('/@:name', needsAuth, followCtrl.getFollow);
follow.post('/@:name', needsAuth, followCtrl.follow);
follow.delete('/@:name', needsAuth, followCtrl.unfollow);

follow.get('/@:name/following', needsAuth, followCtrl.getFollowingList);
follow.get('/@:name/follower', needsAuth, followCtrl.getFollowerList);

export default follow;
