import { Schema, Model, Document, model } from 'mongoose';
import { IUser } from './User';
import { INotice } from './Notice';

export interface INoticeMessage extends Document {
  sender: IUser;
  recipient: IUser;
  notice: INotice;
  message: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface INoticeMessageModel extends Model<INoticeMessage> {}

const schema = new Schema(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    notice: {
      type: Schema.Types.ObjectId,
      ref: 'Notice',
    },
    message: String,
  },
  {
    timestamps: true,
  }
);

schema.index({ sender: -1, notice: -1, recipient: -1 });

const NoticeMessage = model<INoticeMessage, INoticeMessageModel>('NoticeMessage', schema);

export default NoticeMessage;
