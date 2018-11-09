import { Schema, model, Document, Model, DocumentQuery } from 'mongoose';
import { IUser } from './User';
import { IPost } from './Post';

export interface ILike extends Document {
  user: IUser;
  post: IPost;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILikeModel extends Model<ILike> {
  checkExists(userId: string, postId: string): Promise<ILike>;
  likePosts(userId: string, cursor: string | null): Promise<ILike[]>;
}

const LikeSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      index: true,
    },
  },
  {
    timestamps: true,
    autoIndex: false,
  }
);

LikeSchema.index({ _id: -1 });

LikeSchema.statics.checkExists = function(
  userId: string,
  postId: string
): Promise<any> {
  return this.findOne({
    $and: [{ user: userId }, { post: postId }],
  })
    .lean()
    .exec();
};

LikeSchema.statics.likePosts = function(userId: string, cursor: string | null) {
  const query = Object.assign(
    {},
    cursor ? { _id: { $lt: cursor }, user: userId } : { user: userId }
  );

  return this.find(query)
    .populate({
      path: 'post',
      populate: {
        path: 'user',
        select: 'profile',
      },
    })
    .select('post')
    .sort({ _id: -1 })
    .limit(10)
    .lean()
    .exec();
};

const Like = model<ILike>('Like', LikeSchema) as ILikeModel;

export default Like;
