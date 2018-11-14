import * as Router from 'koa-router';
import * as authCtrl from './auth.ctrl';
import callback from './callback';

const auth = new Router();

auth.post('/register/local', authCtrl.localRegister);
auth.post('/login/local', authCtrl.localLogin);
auth.post('/logout', authCtrl.logout);

auth.get('/check', authCtrl.checkUser);
auth.get('/exists/:key(email|username)/:value', authCtrl.checkExists);

auth.post('/register/:provider(facebook|google)', authCtrl.socialRegister);
auth.post('/login/:provider(facebook|google)', authCtrl.socialLogin);
auth.post('/verify-social/:provider(facebook|google)', authCtrl.verifySocial);
auth.use('/callback', callback.routes());

export default auth;
