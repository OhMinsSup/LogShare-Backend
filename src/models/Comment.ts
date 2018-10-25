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
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface ICommentModel extends Model<IComment> {}

const CommentSchema = new Schema(
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
      index: true,
    },
    level: {
      type: Number,
      default: 0,
    },
    visible: {
      type: Boolean,
      default: true,
    },
    text: String,
  },
  {
    timestamps: true,
  }
);

const Comment = model<IComment>('Comment', CommentSchema) as ICommentModel;

export default Comment;
