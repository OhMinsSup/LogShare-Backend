import { Schema, Model, Document, model } from 'mongoose';
import { IUser } from './User';
import { INotice } from './Notice';

export interface INoticeMessage extends Document {
  sender: IUser;
  recipient: IUser;
  notice: INotice;
  message: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface INoticeMessageModel extends Model<INoticeMessage> {}

const ignoreEmpty = val => (val !== '' ? val : undefined);

const NoticeMessageSchema = new Schema(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      set: ignoreEmpty,
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      set: ignoreEmpty,
    },
    notice: {
      type: Schema.Types.ObjectId,
      ref: 'Notice',
      index: true,
    },
    message: String,
  },
  {
    timestamps: true,
  }
);

const NoticeMessage = model<INoticeMessage>(
  'NoticeMessage',
  NoticeMessageSchema
) as INoticeMessageModel;

export default NoticeMessage;
