import { Schema, model, Document, Model, DocumentQuery } from 'mongoose';
import { IUser } from './User';
import { IPost } from './Post';

export interface ILike extends Document {
  user: IUser;
  post: IPost;
  createdAt: Date;
  updatedAt: Date;
  user_docs?: IUser;
}

export interface ILikeModel extends Model<ILike> {
  checkExists: (userId: string, postId: string) => Promise<ILike>;
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
  },
  {
    timestamps: true,
  }
);

schema.index({
  user: -1,
  post: -1,
});

schema.statics.checkExists = function(userId: string, postId: string): Promise<any> {
  return this.findOne({
    $and: [{ user: userId }, { post: postId }],
  }).exec();
};

const Like = model<ILike, ILikeModel>('Like', schema);

export default Like;
