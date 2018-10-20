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

  validatePassword(password: string): boolean;
  generate(): Promise<string>;
}

export interface IUserModel extends Model<IUser> {
  findByEmailOrUsername(
    type: 'email' | 'username',
    value: string
  ): DocumentQuery<IUser, IUser>;
  localRegister(
    username: string,
    email: string,
    password: string
  ): DocumentQuery<IUser, IUser>;
}

const userSchema = new Schema(
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
        default: '',
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
  },
  { timestamps: true }
);

userSchema.statics.findByEmailOrUsername = function(
  type: 'email' | 'username',
  value: string
) {
  const key = type === 'email' ? 'email' : 'profile.username';

  return this.findOne({
    [key]: value,
  })
    .lean()
    .exec();
};

userSchema.statics.localRegister = function(
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

userSchema.methods.validatePassword = function(password: string): boolean {
  const hashed: string = hash(password);
  return this.password === hashed;
};

userSchema.methods.generate = function(): Promise<string> {
  const user = {
    _id: this._id,
    email: this.email,
    profile: this.profile,
  };

  return generateToken(user);
};
const User = model<IUser, IUserModel>('User', userSchema);

export default User;
