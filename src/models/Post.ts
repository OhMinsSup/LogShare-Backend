import { Document, Model, Schema, model, DocumentQuery } from 'mongoose';
import { IUser } from './User';

export interface IPost extends Document {
  user: IUser | string;
  post_thumbnail: string;
  title: string;
  body: string;
  info: {
    likes: number;
    comments: number;
  };
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface IPostModel extends Model<IPost> {
  readPostById(postId: string): Promise<DocumentQuery<IPost, IPost>>;
}

const PostSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    post_thumbnail: String,
    title: String,
    body: String,
    info: {
      likes: {
        type: Number,
        default: 0,
      },
      comments: {
        type: Number,
        default: 0,
      },
    },
  },
  { timestamps: true }
);

PostSchema.statics.readPostById = function(postId: string) {
  return this.findById(postId)
    .populate('user')
    .lean()
    .exec();
};

const Post = model<IPost>('Post', PostSchema) as IPostModel;

export default Post;
