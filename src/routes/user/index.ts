import * as Router from 'koa-router';
import * as userCtrl from './user.ctrl';
import { needsAuth } from '../../lib/utils';

const user = new Router();

user.get('/info/@:name', userCtrl.getUserInfo);
user.post('/profile', needsAuth, userCtrl.profileUpdate);
user.get('/', userCtrl.usersList);

export default user;
