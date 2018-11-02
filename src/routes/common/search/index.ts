import * as Router from 'koa-router';
import * as searchCtrl from './search.ctrl';
import { needsAuth } from '../../../lib/common';

const search = new Router();

search.get('/post/:value', needsAuth, searchCtrl.searchPostList);
search.get('/user/:value', needsAuth, searchCtrl.searchUserList);

export default search;
