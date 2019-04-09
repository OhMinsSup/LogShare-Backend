import { Schema, model, Model, Document } from 'mongoose';
import { IUser } from './User';

export interface IFollow extends Document {
  following: IUser;
  follower: IUser;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFollowModel extends Model<IFollow> {
  checkExists: (userId: string, followId: string) => Promise<IFollow>;
}

const schema = new Schema(
  {
    following: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    follower: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

schema.statics.checkExists = function checkExists(
  userId: string,
  followId: string
): Promise<IFollow> {
  const Follow: IFollowModel = this;
  return Follow.findOne({
    $and: [{ following: followId }, { follower: userId }],
  }).exec();
};

const Follow = model<IFollow, IFollowModel>('Follow', schema);

export default Follow;
