import * as Router from 'koa-router';
import * as seriesCtrl from './series.ctrl';
import { needsAuth } from '../../lib/common';

const series = new Router();

series.post('/', needsAuth, seriesCtrl.createSeries);

export default series;
