import { Schema, Model, model, Document } from 'mongoose';
import { IUser } from './User';

export interface INotice extends Document {
  creator: IUser;
  createdAt: Date;
  updatedAt: Date;
}

export interface INoticeModel extends Model<INotice> {}

const schema = new Schema(
  {
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

const Notice = model<INotice, INoticeModel>('Notice', schema);

export default Notice;
