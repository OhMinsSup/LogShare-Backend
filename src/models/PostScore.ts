import { Schema, Model, Document, model } from 'mongoose';
import { IUser } from './User';
import { IPost } from './Post';

export const Types = {
  LIKE: 'LIKE',
  COMMENT: 'COMMENT',
  READ: 'READ',
};

export interface IPostScore extends Document {
  user: IUser;
  post: IPost;
  type: string;
  score: number;
}

export interface IPostSocreModel extends Model<IPostScore> {}

const ScoreSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  post: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
  },
  type: String,
  score: {
    type: Number,
    default: 0,
  },
});

const PostScore = model<IPostScore>('Score', ScoreSchema) as IPostSocreModel;

export default PostScore;
