import { Document, Schema, model, Model } from 'mongoose';
import { IUser } from './User';

export interface IUserProfile extends Document {
  user: IUser;
  profile_links: {
    facebook: string;
    twitter: string;
    github: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserProfileModel extends Model<IUserProfile> {}

const schema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    profile_links: {
      facebook: {
        type: String,
        default: '',
      },
      twitter: {
        type: String,
        default: '',
      },
      github: {
        type: String,
        default: '',
      },
    },
  },
  { timestamps: true }
);

const UserProfile = model<IUserProfile, IUserProfileModel>('UserProfile', schema);

export default UserProfile;
