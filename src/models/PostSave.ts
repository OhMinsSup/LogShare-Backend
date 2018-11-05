import { Document, Model, Schema, model } from 'mongoose';
import { IPost } from './Post';
import { IUser } from './User';

export interface IPostSave extends Document {
  user: IUser;
  post: IPost;
  title: string;
  body: string;
  tags: string[];
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface IPostSaveModel extends Model<IPostSave> {}

const PostSaveSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      index: true,
    },
    title: String,
    body: String,
    tags: [String],
  },
  {
    timestamps: true,
    autoIndex: false,
  }
);

const PostSave = model<IPostSave>('PostSave', PostSaveSchema) as IPostSaveModel;

export default PostSave;
