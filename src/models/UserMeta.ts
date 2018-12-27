import { Document, Schema, model, Model } from 'mongoose';
import { IUser } from './User';

export interface IUserMeta extends Document {
  user: IUser;
  email_promotion: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMetaModel extends Model<IUserMeta> {}

const UserMetaSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    email_promotion: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const UserMeta = model<IUserMeta>('UserMeta', UserMetaSchema) as IUserMetaModel;

export default UserMeta;
