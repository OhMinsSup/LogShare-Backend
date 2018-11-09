import { Schema, Model, model, Document } from 'mongoose';
import { IUser } from './User';

export interface INotice extends Document {
  creator: IUser;
  createdAt: Date;
  updatedAt: Date;
}

export interface INoticeModel extends Model<INotice> {}

const NoticeSchema = new Schema(
  {
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
  },
  {
    timestamps: true,
    autoIndex: false,
  }
);

const Notice = model<INotice>('Notice', NoticeSchema) as INoticeModel;

export default Notice;
