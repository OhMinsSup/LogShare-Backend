import { Schema, model, Model, Document, DocumentQuery } from 'mongoose';
import { IUser } from './User';

export interface IFollow extends Document {
  following: IUser;
  follower: IUser;
}

export interface IFollowModel extends Model<IFollow> {
  checkExists(
    userId: string,
    followId: string
  ): Promise<DocumentQuery<IFollow, IFollow>>;
}

const FollowSchema = new Schema(
  {
    following: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    follower: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

FollowSchema.statics.checkExists = function(
  userId: string,
  followId: string
): Promise<any> {
  return this.findOne({
    $and: [{ following: followId }, { follower: userId }],
  })
    .lean()
    .exec();
};

const Follow = model<IFollow>('Follow', FollowSchema) as IFollowModel;

export default Follow;
