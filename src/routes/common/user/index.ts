import * as Router from 'koa-router';
import * as userCtrl from './user.ctrl';
import { needsAuth } from '../../../lib/common';

const user = new Router();

user.get('/info', needsAuth, userCtrl.getUserInfo);

export default user;
