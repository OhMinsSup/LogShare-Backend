import * as Router from 'koa-router';
import * as tagCtrl from './tag.ctrl';
import { needsAuth } from '../../../lib/common';

const tag = new Router();

tag.get('/', needsAuth, tagCtrl.getTags);
tag.get('/:tag', needsAuth, tagCtrl.getTagInfo);

export default tag;
