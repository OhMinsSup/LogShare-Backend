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
  view(hashIp: string, postId: string): Promise<IPostRead>;
}

const PostReadSchema = new Schema(
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

PostReadSchema.statics.view = function(hashIp: string, postId: string) {
  return this.findOne({
    $and: [{ ip: hashIp }, { post: postId }],
  })
    .lean()
    .exec();
};

const PostRead: IPostReadModel = model<IPostRead>(
  'PostRead',
  PostReadSchema
) as IPostReadModel;

export default PostRead;
