import * as Joi from 'joi';
import { Middleware, Context } from 'koa';
import UserProfile from '../../models/UserProfile';
import UserMeta from '../../models/UserMeta';
import UserEmail from '../../models/UserEmail';
import { sendMail } from '../../lib/sendMail';
import { Html } from '../../lib/emailTemplate';

export const getProfileInfo: Middleware = async (ctx: Context) => {
  const { _id: userId } = ctx.state.user;

  try {
    const userProfile = await UserProfile.findOne({
      user: userId,
    }).exec();

    const userMeta = await UserMeta.findOne({
      user: userId,
    }).exec();

    if (!userProfile && !userMeta) {
      const newMeta = await new UserMeta({
        user: userId,
      }).save();

      const newProfile = await new UserProfile({
        user: userId,
      }).save();

      const {
        profile_links: { facebook, twitter, github },
      } = newProfile;
      const { email_promotion } = newMeta;

      ctx.type = 'application/json';
      ctx.body = {
        profile: {
          facebook,
          twitter,
          github,
          email_promotion,
        },
      };
      return;
    }

    const {
      profile_links: { facebook, twitter, github },
    } = userProfile;

    const { email_promotion } = userMeta;

    ctx.type = 'application/json';
    ctx.body = {
      profile: {
        facebook,
        twitter,
        github,
        email_promotion,
      },
    };
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const updateProfileLinks: Middleware = async (ctx: Context) => {
  type BodySchema = {
    facebook: string;
    twitter: string;
    github: string;
  };

  const schema = Joi.object().keys({
    facebook: Joi.string().allow(''),
    github: Joi.string().allow(''),
    twitter: Joi.string().allow(''),
  });

  const result = Joi.validate(ctx.request.body, schema);

  if (result.error) {
    ctx.status = 400;
    ctx.body = {
      name: 'WRONG_SCHEMA',
      payload: result.error,
    };
    return;
  }

  const profile_links = ctx.request.body as BodySchema;
  const { _id: userId } = ctx.state.user;

  try {
    const profile = await UserProfile.findOne({
      user: userId,
    }).exec();

    profile.profile_links = profile_links;
    await profile.save();

    ctx.type = 'application/json';
    ctx.body = profile_links;
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const updateEmailPermissions: Middleware = async (ctx: Context) => {
  type BodySchema = {
    email_promotion: boolean;
  };

  const schema = Joi.object().keys({
    email_promotion: Joi.boolean().required(),
  });

  const result = Joi.validate(ctx.request.body, schema);

  if (result.error) {
    ctx.status = 400;
    ctx.body = {
      name: 'WRONG_SCHEMA',
      payload: result.error,
    };
    return;
  }

  const { email_promotion } = ctx.request.body as BodySchema;
  const { _id: userId } = ctx.state.user;

  try {
    const userMeta = await UserMeta.findOne({
      user: userId,
    }).exec();

    await userMeta.update({
      email_promotion,
    });
    ctx.type = 'application/json';
    ctx.body = email_promotion;
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const sendEmails: Middleware = async (ctx: Context) => {
  try {
    const userMeta = await UserMeta.find({
      email_promotion: true,
    })
      .populate('user')
      .exec();

    const userEmail = await Promise.all(
      userMeta.map(meta => new UserEmail({ email: meta.user.email }).save())
    );

    await Promise.all(
      userEmail.map(email =>
        sendMail({
          to: email.email,
          from: '운영자 <verification@gmail.com>',
          subject: '이벤트 프로모션',
          html: Html(),
        })
      )
    );
    ctx.type = 'application/json';
    ctx.status = 200;
  } catch (e) {
    ctx.throw(500, e);
  }
};
