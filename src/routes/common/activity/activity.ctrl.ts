import { Middleware, Context } from 'koa';

export const activityRecord: Middleware = async (
  ctx: Context
): Promise<any> => {
  type ParamsPayload = {
    name: string;
  };

  const { name }: ParamsPayload = ctx.params;

  try {
  } catch (e) {
    ctx.throw(500, e);
  }
};
