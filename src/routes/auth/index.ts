import * as Router from 'koa-router';
import * as authCtrl from './auth.ctrl';

const auth = new Router();

auth.post('/register/local', authCtrl.localRegister);

export default auth;
