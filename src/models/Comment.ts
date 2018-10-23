import { Model, Document, Schema, model } from 'mongoose';
import { IPost } from './Post';
import { IUser } from './User';

export interface IComment extends Document {
  post: IPost;
  user: IUser;
  reply: IComment;
  level: number;
  text: string;
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
    text: String,
  },
  {
    timestamps: true,
  }
);

CommentSchema.statics.readComment = function(commentId: string) {
  return this.findById(commentId)
    .populate('reply')
    .lean()
    .exec();
};

const Comment = model<IComment>('Comment', CommentSchema) as ICommentModel;

export default Comment;
