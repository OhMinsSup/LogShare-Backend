import * as jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
import { Context } from 'koa';
dotenv.config();

const { JWT_SECRET } = process.env;

export function generateToken(payload: any, options?: any): Promise<string> {
  return new Promise((resolve, reject) => {
    jwt.sign(
      payload,
      JWT_SECRET,
      {
        expiresIn: '7d',
        ...options,
      },
      (err, token) => {
        if (err) reject(err);
        resolve(token);
      }
    );
  });
}

export function decodeToken(token: string): Promise<any> {
  return new Promise((resolve, reject) => {
    jwt.verify(token, JWT_SECRET, (error, decoded) => {
      if (error) reject(error);
      resolve(decoded);
    });
  });
}

export type TokenPayload = {
  _id: string;
  email: string;
  profile: {
    thumbnail: string;
    shortBio: string;
    username: string;
  };
};

export const setTokenCookie = (ctx: Context, token: string | null) => {
  // set cookie
  ctx.cookies.set('access_token', token, {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7,
    // domain: process.env.NODE_ENV === 'development' ? undefined : '.logshare-backend.herokuapp.com',
  });
};
