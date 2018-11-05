import { Middleware, Context } from 'koa';

export const temporaryPost: Middleware = async (
  ctx: Context
): Promise<any> => {};

export const temporaryReadPost: Middleware = async (
  ctx: Context
): Promise<any> => {};

export const deleteTempPost: Middleware = async (
  ctx: Context
): Promise<any> => {};

export const temporaryPostsList: Middleware = async (
  ctx: Context
): Promise<any> => {};
