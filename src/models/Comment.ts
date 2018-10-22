import { Model, Document, Schema, model } from 'mongoose';

export interface IComment extends Document {}

export interface ICommentModel extends Model<IComment> {}

const CommentSchema = new Schema({});

const Comment = model<IComment>('Comment', CommentSchema) as ICommentModel;

export default Comment;
