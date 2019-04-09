import { Schema, Model, Document, model } from 'mongoose';
import { IUser } from './User';
import { IPost } from './Post';

export interface IPostRead extends Document {
  user: IUser;
  post: IPost;
  ip: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPostReadModel extends Model<IPostRead> {
  view: (hashIp: string, postId: string) => Promise<IPostRead | null>;
}

const schema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
    },
    ip: String,
  },
  {
    timestamps: true,
  }
);

schema.statics.view = function view(hashIp: string, postId: string): Promise<IPostRead | null> {
  const PostRead: IPostReadModel = this;
  return PostRead.findOne({
    $and: [{ ip: hashIp }, { post: postId }],
  })
    .sort({ _id: -1 })
    .exec();
};

const PostRead = model<IPostRead, IPostReadModel>('PostRead', schema);

export default PostRead;
