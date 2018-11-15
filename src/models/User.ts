import { Document, Schema, model, Model, DocumentQuery } from 'mongoose';
import { hash } from '../lib/common';
import { generateToken } from '../lib/token';

export interface IUser extends Document {
  email: string;
  password: string;
  profile: {
    username: string;
    thumbnail: string;
    shortBio: string;
  };
  social: {
    facebook: {
      id: string;
      accessToken: string;
    };
    google: {
      id: string;
      accessToken: string;
    };
  };
  info: {
    post: number;
    follower: number;
    following: number;
  };
  createdAt: Date;
  updatedAt: Date;

  validatePassword(password: string): boolean;
  generate(): Promise<string>;
}

export interface IUserModel extends Model<IUser> {
  findByEmailOrUsername(
    type: 'email' | 'username',
    value: string
  ): Promise<IUser>;
  findBySocial(provider: string, socialId: string | number): Promise<IUser>;
  localRegister(
    username: string,
    email: string,
    password: string
  ): Promise<IUser>;
  Count(
    type: 'post' | 'follower' | 'following',
    userId: string
  ): Promise<IUser>;
  unCount(
    type: 'post' | 'follower' | 'following',
    userId: string
  ): Promise<IUser>;
}

const UserSchema = new Schema(
  {
    email: String,
    password: String,
    profile: {
      username: String,
      thumbnail: {
        type: String,
        default: 'https://avatars.io/platform/userId',
      },
      shortBio: {
        type: String,
        default: 'LogShare에 자신을 소개해 주세요',
      },
    },
    social: {
      facebook: {
        id: String,
        accessToken: String,
      },
      google: {
        id: String,
        accessToken: String,
      },
    },
    info: {
      post: {
        type: Number,
        default: 0,
      },
      follower: {
        type: Number,
        default: 0,
      },
      following: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
    autoIndex: false,
  }
);

UserSchema.statics.findByEmailOrUsername = function(
  type: 'email' | 'username',
  value: string
) {
  const key = type === 'email' ? 'email' : 'profile.username';

  return this.findOne({
    [key]: value,
  }).exec();
};

UserSchema.statics.findBySocial = function(
  provider: string,
  socialId: string | number
) {
  const key = `social.${provider}.id`;

  return this.findOne({
    [key]: socialId,
  }).exec();
};

UserSchema.statics.localRegister = function(
  username: string,
  email: string,
  password: string
) {
  const user: IUser = new this({
    profile: {
      username,
    },
    email,
    password: hash(password),
  });

  return user.save();
};

UserSchema.statics.Count = function(
  type: 'post' | 'follower' | 'following',
  userId: string
) {
  const key = `info.${type}`;

  return this.findByIdAndUpdate(
    userId,
    {
      $inc: {
        [key]: 1,
      },
    },
    { new: true }
  )
    .lean()
    .exec();
};

UserSchema.statics.unCount = function(
  type: 'post' | 'follower' | 'following',
  userId: string
) {
  const key = `info.${type}`;

  return this.findByIdAndUpdate(
    userId,
    {
      $inc: {
        [key]: -1,
      },
    },
    { new: true }
  )
    .lean()
    .exec();
};

UserSchema.methods.validatePassword = function(password: string) {
  const hashed: string = hash(password);
  return this.password === hashed;
};

UserSchema.methods.generate = function() {
  const user = {
    _id: this._id,
    email: this.email,
    profile: this.profile,
  };

  return generateToken(user);
};

const User = model<IUser>('User', UserSchema) as IUserModel;

export default User;
