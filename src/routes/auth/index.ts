import * as Router from 'koa-router';
import * as authCtrl from './auth.ctrl';
import callback from './callback';
import { needsAuth } from '../../lib/common';

const auth = new Router();

auth.post('/register/local', authCtrl.localRegister);
auth.post('/login/local', authCtrl.localLogin);
auth.post('/logout', authCtrl.logout);

auth.get('/check', authCtrl.checkUser);
auth.get('/exists/:key(email|username)/:value', authCtrl.checkExists);

auth.post(
  '/register/:provider(facebook|google|github)',
  authCtrl.socialRegister
);
auth.post('/login/:provider(facebook|google|github)', authCtrl.socialLogin);
auth.post(
  '/verify-social/:provider(facebook|google|github)',
  authCtrl.verifySocial
);
auth.get('/unregister-token', needsAuth, authCtrl.generateUnregisterToken);
auth.post('/unregister', needsAuth, authCtrl.unRegister);
auth.use('/callback', callback.routes());

export default auth;
