import { Context, Middleware } from 'koa';
import { google } from 'googleapis';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';
dotenv.config();

const { GOOGLE_ID, GOOGLE_SECRET } = process.env;

export const redirectGoogleLogin: Middleware = (ctx: Context) => {
  type QueryPayload = {
    next: string;
  };
  const { next }: QueryPayload = ctx.query;

  const callbackUrl = 'http://localhost:4000/auth/callback/google';

  if (!GOOGLE_ID || !GOOGLE_SECRET) {
    console.log('Google ENVVAR is missing');
    ctx.throw(500);
  }

  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_ID,
    GOOGLE_SECRET,
    callbackUrl
  );

  const url = oauth2Client.generateAuthUrl({
    scope: ['https://www.googleapis.com/auth/plus.me'],
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

  const callbackUrl = 'http://localhost:4000/auth/callback/google';

  if (!code) {
    ctx.redirect(`http://localhost:4000/?callback?error=1`);
    return;
  }

  if (!GOOGLE_ID || !GOOGLE_SECRET) {
    console.log('Google ENVVAR is missing');
    ctx.throw(500);
  }

  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_ID,
    GOOGLE_SECRET,
    callbackUrl
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens) {
      ctx.status = 401;
      return;
    }

    const { access_token } = tokens;
    const hash = crypto.randomBytes(40).toString('hex');

    ctx.cookies.set('social_token', access_token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    let nextUrl = `http://localhost:3000/callback?type=google&key=${hash}`;

    if (state) {
      const { next } = JSON.parse(state);
      nextUrl += `&next=${next}`;
    }

    ctx.redirect(encodeURI(nextUrl));
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const deleteToken: Middleware = (ctx: Context) => {
  ctx.cookies.set('social_token', null, {
    httpOnly: true,
    maxAge: 0,
  });

  ctx.status = 204;
};

export const getToken: Middleware = (ctx: Context) => {
  try {
    const token: string | void = ctx.cookies.get('social_token');

    if (!token) {
      ctx.status = 400;
      return;
    }
    ctx.body = {
      token,
    };
  } catch (e) {
    ctx.throw(500, e);
  }
};
