import * as Router from 'koa-router';
import * as videosCtrl from './videos.ctrl';

const videos = new Router();

videos.get('/public', videosCtrl.listVideos);
videos.get('/@:username', videosCtrl.listVideos);
videos.get('/side', videosCtrl.SideVideoList);

export default videos;
