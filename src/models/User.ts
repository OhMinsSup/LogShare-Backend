import { Document, Schema, model, Model } from 'mongoose';
import { hash } from '../lib/utils';
import { generateToken } from '../lib/token';
import { ILike } from './Like';

export interface IUser extends Document {
  email: string;
  password: string;
  profile: {
    username: string;
    thumbnail: string;
    shortBio: string;
    cover: string;
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
  like_docs?: ILike;
  count(type: 'post' | 'follower' | 'following', calc: boolean): Promise<any>;
  validatePassword(password: string): boolean;
  generate(): Promise<string>;
}

export interface IUserModel extends Model<IUser> {
  followCount: (type: 'follower' | 'following', userId: string, calc: boolean) => Promise<IUser>;
  findByEmailOrUsername: (email?: string, username?: string) => Promise<IUser>;
  findBySocial: (provider: string, socialId: string | number) => Promise<IUser | null>;
  localRegister: (username: string, email: string, password: string) => Promise<IUser>;
}

const schema = new Schema(
  {
    email: {
      type: String,
      unique: true,
    },
    password: String,
    profile: {
      username: {
        type: String,
        unique: true,
      },
      thumbnail: {
        type: String,
        default: 'https://avatars.io/platform/userId',
      },
      shortBio: String,
      cover: String,
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
  }
);

schema.statics.findByEmailOrUsername = function(
  email?: string,
  username?: string
): Promise<IUser | null> {
  const User: IUserModel = this;

  return User.findOne({
    $or: [{ email }, { 'profile.username': username }],
  }).exec();
};

schema.statics.findBySocial = function(provider: string, socialId: string | number) {
  const key = `social.${provider}.id`;

  return this.findOne({
    [key]: socialId,
  }).exec();
};

schema.statics.localRegister = function(
  username: string,
  email: string,
  password: string
): Promise<IUser> {
  const User: IUserModel = this;
  const user = new User({
    profile: {
      username,
    },
    email,
    password: hash(password),
  }).save();

  if (!user) {
    const error = new Error('UserError');
    error.message = 'UserNotCreatedError';
    throw error;
  }

  return user;
};

schema.methods.count = function count(
  type: 'post' | 'follower' | 'following',
  calc: boolean = true
): Promise<any> {
  const result = calc ? 1 : -1;
  const key = `info.${type}`;
  const query = {
    $inc: {
      [key]: result,
    },
  };
  return this.update(query).exec();
};

schema.statics.followCount = function followCount(
  type: 'follower' | 'following',
  userId: string,
  calc: boolean = true
): Promise<IUser> {
  const User: IUserModel = this;
  const key = `info.${type}`;
  const result = calc ? 1 : -1;

  return User.findOneAndUpdate(
    {
      _id: userId,
    },
    {
      $inc: {
        [key]: result,
      },
    },
    { new: true }
  ).exec();
};

schema.methods.validatePassword = function(password: string) {
  const hashed: string = hash(password);
  return this.password === hashed;
};

schema.methods.generate = function() {
  const user = {
    _id: this._id,
    email: this.email,
    profile: this.profile,
  };

  return generateToken(user);
};

const User = model<IUser, IUserModel>('User', schema);

export default User;
