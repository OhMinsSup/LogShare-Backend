import { Model, Document, Schema, model } from 'mongoose';
import { IPost } from './Post';
import { IUser } from './User';

export interface IComment extends Document {
  post: IPost;
  user: IUser;
  reply: IComment;
  level: number;
  text: string;
  visible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICommentModel extends Model<IComment> {}

const schema = new Schema(
  {
    post: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reply: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
    },
    level: {
      type: Number,
      default: 0,
    },
    visible: {
      type: Boolean,
      default: false,
    },
    text: String,
  },
  {
    timestamps: true,
  }
);

const Comment = model<IComment, ICommentModel>('Comment', schema);

export default Comment;
