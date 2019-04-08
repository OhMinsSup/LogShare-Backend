import { Context, Middleware } from 'koa';
import { google } from 'googleapis';
import axios from 'axios';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';
import * as qs from 'qs';
dotenv.config();

const { GOOGLE_ID, GOOGLE_SECRET } = process.env;

const baseUrl =
  process.env.NODE_ENV === 'development'
    ? 'https://localhost:3000/'
    : 'https://logshare.netlify.com/';

export const redirectGoogleLogin: Middleware = (ctx: Context) => {
  type QueryPayload = {
    next: string;
  };
  const { next }: QueryPayload = ctx.query;

  const callbackUrl =
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:4000/auth/callback/google'
      : 'https://logshare-backend.herokuapp.com/auth/callback/google';

  if (!GOOGLE_ID || !GOOGLE_SECRET) {
    console.log('Google ENVVAR is missing');
    ctx.throw(500);
    return;
  }

  const oauth2Client = new google.auth.OAuth2(GOOGLE_ID, GOOGLE_SECRET, callbackUrl);

  const url = oauth2Client.generateAuthUrl({
    scope: [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/plus.me',
      'https://www.googleapis.com/auth/plus.profiles.read',
    ],
    state: JSON.stringify({ next: next || '/recent' }),
  });

  ctx.redirect(url);
};

export const googleCallback: Middleware = async (ctx: Context) => {
  type QueryPayload = {
    code: string;
    state: string;
  };

  const { code, state }: QueryPayload = ctx.query;
  const callbackUrl =
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:4000/auth/callback/google'
      : 'https://logshare-backend.herokuapp.com/auth/callback/google';

  if (!code) {
    ctx.redirect(`${baseUrl}/?callback?error=1`);
    return;
  }

  if (!GOOGLE_ID || !GOOGLE_SECRET) {
    console.log('Google ENVVAR is missing');
    ctx.throw(500);
    return;
  }

  const oauth2Client = new google.auth.OAuth2(GOOGLE_ID, GOOGLE_SECRET, callbackUrl);

  try {
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens) {
      ctx.status = 401;
      return;
    }

    const { access_token } = tokens;
    const hash = crypto.randomBytes(40).toString('hex');

    let nextUrl = `${baseUrl}/callback?type=google&key=${hash}`;

    if (state) {
      const { next } = JSON.parse(state);
      nextUrl += `&next=${next}`;
    }

    ctx.session.social_token = access_token;
    ctx.redirect(encodeURI(nextUrl));
  } catch (e) {
    ctx.throw(500, e);
  }
};

const { FACEBOOK_ID, FACEBOOK_SECRET } = process.env;

export const redirectFacebookLogin: Middleware = (ctx: Context) => {
  type QueryPayload = {
    next: string;
  };

  const { next }: QueryPayload = ctx.query;

  if (!FACEBOOK_ID || !FACEBOOK_SECRET) {
    console.log('Facebook ENVVAR is missing');
    ctx.throw(500);
    return;
  }

  const state = JSON.stringify({ next: next || '/recent' });
  const callbackUrl =
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:4000/auth/callback/facebook'
      : 'https://logshare-backend.herokuapp.com/auth/callback/facebook';

  const authUrl = `https://www.facebook.com/v3.2/dialog/oauth?client_id=${FACEBOOK_ID}&redirect_uri=${callbackUrl}&state=${state}&scope=email,public_profile`;
  ctx.redirect(encodeURI(authUrl));
};

export const facebookCallback: Middleware = async (ctx: Context) => {
  type QueryPayload = {
    code: string;
    state: string;
  };

  const { code, state }: QueryPayload = ctx.query;
  const callbackUrl =
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:4000/auth/callback/facebook'
      : 'https://logshare-backend.herokuapp.com/auth/callback/facebook';

  if (!code) {
    ctx.redirect(`${baseUrl}/?callback?error=1`);
    return;
  }

  if (!FACEBOOK_ID || !FACEBOOK_SECRET) {
    console.log('Facebook ENVVAR is missing');
    ctx.throw(500);
  }

  try {
    const response = await axios.get(
      `https://graph.facebook.com/v3.2/oauth/access_token?${qs.stringify({
        client_id: FACEBOOK_ID,
        redirect_uri: callbackUrl,
        client_secret: FACEBOOK_SECRET,
        code,
      })}`
    );

    const { access_token } = response.data;

    if (!access_token) {
      ctx.redirect(`${baseUrl}/?callback?error=1`);
      return;
    }

    const hash = crypto.randomBytes(40).toString('hex');
    let nextUrl = `${baseUrl}/callback?type=facebook&key=${hash}`;

    if (state) {
      const { next } = JSON.parse(state);
      nextUrl += `&next=${next}`;
    }

    ctx.session.social_token = access_token;
    ctx.redirect(encodeURI(nextUrl));
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const githubCallback: Middleware = async (ctx: Context) => {
  const { GITHUB_ID, GITHUB_SECRET } = process.env;

  try {
    const response = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: GITHUB_ID,
        client_secret: GITHUB_SECRET,
        code: ctx.query.code,
      },
      {
        headers: {
          accept: 'application/json',
        },
      }
    );

    if (response.data.error) {
      throw new Error(response.data.error);
    }

    const hash = crypto.randomBytes(40).toString('hex');

    let nextUrl = `${baseUrl}/callback?type=github&key=${hash}`;

    const { next } = ctx.query;

    if (next) {
      nextUrl += `&next=${next}`;
    }

    ctx.session.social_token = response.data.access_token;
    ctx.redirect(encodeURI(nextUrl));
    ctx.type = 'application/json';
    ctx.body = response.data;
  } catch (e) {
    ctx.status = 401;
    let nextUrl = `${baseUrl}/callback?error=1`;
    ctx.redirect(nextUrl);
  }
};

export const getToken: Middleware = (ctx: Context) => {
  try {
    const token: string = ctx.session.social_token;

    if (!token) {
      ctx.status = 400;
      return;
    }
    ctx.type = 'application/json';
    ctx.body = {
      token,
    };
  } catch (e) {
    ctx.throw(500, e);
  }
};
