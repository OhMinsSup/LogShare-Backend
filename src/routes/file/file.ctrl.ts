import { Middleware, Context } from 'koa';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { TokenPayload } from '../../lib/token';
import { parseTime, parserImage } from '../../lib/common';
dotenv.config();

const {
  CLOUDINARY_API_SECRET,
  CLOUDINARY_APIKEY,
  CLOUDINARY_CLOUD_NAME,
} = process.env;

const cloudinary = require('cloudinary');

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_APIKEY,
  api_secret: CLOUDINARY_API_SECRET,
});

export const createPostImageSignedUrl: Middleware = async (ctx: Context) => {
  const { image } = ctx.request.files;
  const user: TokenPayload = ctx['user'];

  if (!user) {
    ctx.status = 401;
    return;
  }

  if (!image) {
    ctx.status = 400;
    ctx.body = {
      name: 'File',
      payload: '파일을 전달해 줘야합니다',
    };
    return;
  }

  const stats = fs.statSync(image.path);

  if (!stats) {
    ctx.throw(500, 'failed to load stats');
    return;
  }

  if (stats.size > 1024 * 1024 * 8) {
    ctx.status = 403;
    ctx.body = {
      name: 'FILE_SIZE_EXCEEDS',
      payload: '8MB',
    };
    return;
  }

  const splitFileName: string[] = image.name.split('.');
  const filename: string = splitFileName[0];

  const response = await cloudinary.v2.uploader.upload(image.path, {
    public_id: `LogShare/post-image/${user.profile.username}/${filename}`,
  });

  if (!response) {
    ctx.status = 418;
    ctx.body = {
      name: 'UPLOAD',
      payload: '파일 업로드에 실패하였습니다',
    };
  }

  ctx.body = {
    url: response.url,
    path: `LogShare/post-image/${user.profile.username}/${filename}`,
    name: filename,
  };
};

export const createCommonUserCoverBgSignedUrl: Middleware = async (
  ctx: Context
) => {
  const { cover } = ctx.request.files;
  const user: TokenPayload = ctx['user'];

  if (!user) {
    ctx.status = 401;
    return;
  }

  if (!cover) {
    ctx.status = 400;
    ctx.body = {
      name: 'File',
      payload: '파일을 전달해 줘야합니다',
    };
    return;
  }

  const stats = fs.statSync(cover.path);

  if (!stats) {
    ctx.throw(500, 'failed to load stats');
    return;
  }

  if (stats.size > 1024 * 1024 * 8) {
    ctx.status = 403;
    ctx.body = {
      name: 'FILE_SIZE_EXCEEDS',
      payload: '8MB',
    };
    return;
  }

  const splitFileName: string[] = cover.name.split('.');
  const filename: string = splitFileName[0];

  const response = await cloudinary.v2.uploader.upload(cover.path, {
    public_id: `LogShare/common-cover-background/${
      user.profile.username
    }/${filename}`,
    width: 800,
    height: 533,
  });

  if (!response) {
    ctx.status = 418;
    ctx.body = {
      name: 'UPLOAD',
      payload: '파일 업로드에 실패하였습니다',
    };
  }

  ctx.body = {
    url: response.url,
    path: `LogShare/common-thumbnail/${user.profile.username}/${filename}`,
    name: filename,
  };
};

export const createCommonThumbnailSignedUrl: Middleware = async (
  ctx: Context
) => {
  const { thumbnail } = ctx.request.files;
  const user: TokenPayload = ctx['user'];

  if (!user) {
    ctx.status = 401;
    return;
  }

  if (!thumbnail) {
    ctx.status = 400;
    ctx.body = {
      name: 'File',
      payload: '파일을 전달해 줘야합니다',
    };
    return;
  }

  const stats = fs.statSync(thumbnail.path);

  if (!stats) {
    ctx.throw(500, 'failed to load stats');
    return;
  }

  if (stats.size > 1024 * 1024 * 8) {
    ctx.status = 403;
    ctx.body = {
      name: 'FILE_SIZE_EXCEEDS',
      payload: '8MB',
    };
    return;
  }

  const splitFileName: string[] = thumbnail.name.split('.');
  const filename: string = splitFileName[0];

  const response = await cloudinary.v2.uploader.upload(thumbnail.path, {
    public_id: `LogShare/common-thumbnail/${user.profile.username}/${filename}`,
    width: 128,
    height: 128,
  });

  if (!response) {
    ctx.status = 418;
    ctx.body = {
      name: 'UPLOAD',
      payload: '파일 업로드에 실패하였습니다',
    };
  }

  ctx.body = {
    url: response.url,
    path: `LogShare/common-thumbnail/${user.profile.username}/${filename}`,
    name: filename,
  };
};

export const createVideoUploadSignedUrl: Middleware = async (ctx: Context) => {
  const { video } = ctx.request.files;
  const user: TokenPayload = ctx['user'];

  if (!user) {
    ctx.status = 401;
    return;
  }

  if (!video) {
    ctx.status = 400;
    ctx.body = {
      name: 'File',
      payload: '파일을 전달해 줘야합니다',
    };
    return;
  }

  const stats = fs.statSync(video.path);

  if (!stats) {
    ctx.throw(500, 'failed to load stats');
    return;
  }

  const splitFileName: string[] = video.name.split('.');
  const filename: string = splitFileName[0];

  try {
    const response = await cloudinary.v2.uploader.upload(video.path, {
      resource_type: 'video',
      public_id: `LogShare/video-upload/${user.profile.username}/${filename}`,
    });

    if (!response) {
      ctx.status = 418;
      ctx.body = {
        name: 'UPLOAD',
        payload: '파일 업로드에 실패하였습니다',
      };
    }

    ctx.body = {
      path: `LogShare/video-upload/${user.profile.username}/${filename}`,
      name: filename,
      url: response.secure_url,
      thumbnail: parserImage(response.secure_url, response.format, 'jpg'),
      time: parseTime(response.duration),
      format: response.format,
    };
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const createVideoThumbnailSignedUrl: Middleware = async (
  ctx: Context
) => {
  const { image } = ctx.request.files;
  const user: TokenPayload = ctx['user'];

  if (!user) {
    ctx.status = 401;
    return;
  }

  if (!image) {
    ctx.status = 400;
    ctx.body = {
      name: 'File',
      payload: '파일을 전달해 줘야합니다',
    };
    return;
  }

  const stats = fs.statSync(image.path);

  if (!stats) {
    ctx.throw(500, 'failed to load stats');
    return;
  }

  if (stats.size > 1024 * 1024 * 8) {
    ctx.status = 403;
    ctx.body = {
      name: 'FILE_SIZE_EXCEEDS',
      payload: '8MB',
    };
    return;
  }

  const splitFileName: string[] = image.name.split('.');
  const filename: string = splitFileName[0];

  const response = await cloudinary.v2.uploader.upload(image.path, {
    public_id: `LogShare/video-thumbnail/${user.profile.username}/${filename}`,
  });

  if (!response) {
    ctx.status = 418;
    ctx.body = {
      name: 'UPLOAD',
      payload: '파일 업로드에 실패하였습니다',
    };
  }

  ctx.body = {
    url: response.url,
    path: `LogShare/video-thumbnail/${user.profile.username}/${filename}`,
    name: filename,
  };
};
