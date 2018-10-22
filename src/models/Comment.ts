import { Model, Document, Schema, model } from 'mongoose';
import { IPost } from './Post';
import { IUser } from './User';

export interface IComment extends Document {
  post: IPost;
  user: IUser;
  parent: IComment;
  text: string;
}

export interface ICommentModel extends Model<IComment> {}

const CommentSchema = new Schema({
  post: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  parent: {
    type: Schema.Types.ObjectId,
    ref: 'Comment',
  },
  text: String,
});

const Comment = model<IComment>('Comment', CommentSchema) as ICommentModel;

export default Comment;
