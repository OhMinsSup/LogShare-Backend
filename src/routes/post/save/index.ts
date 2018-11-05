import * as Router from 'koa-router';
import * as saveCtrl from './save.ctrl';
import {
  checkObjectId,
  checktemporaryPostExistancy,
} from '../../../lib/common';

const save = new Router();

save.get('/', saveCtrl.temporaryPostsList);
save.post('/', saveCtrl.temporaryPost);
save.delete(
  '/:id',
  checkObjectId,
  checktemporaryPostExistancy,
  saveCtrl.deleteTempPost
);
save.get(
  '/:id',
  checkObjectId,
  checktemporaryPostExistancy,
  saveCtrl.temporaryReadPost
);

export default save;
