import * as Router from 'koa-router';
import * as callbackCtrl from './callback.ctrl';

const callback = new Router();

callback.get('/google/login', callbackCtrl.redirectGoogleLogin);
callback.get('/google', callbackCtrl.googleCallback);

callback.delete('/token', callbackCtrl.deleteToken);
callback.post('/token', callbackCtrl.getToken);

export default callback;
