import { Schema, model, Model, Document, DocumentQuery } from 'mongoose';
import { IUser } from './User';

export interface IFollow extends Document {
  following: IUser;
  follower: IUser;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface IFollowModel extends Model<IFollow> {
  checkExists(
    userId: string,
    followId: string
  ): Promise<DocumentQuery<IFollow, IFollow>>;
  getfollowingList(
    followerId: string,
    cursor: string | null
  ): Promise<IFollow[]>;
  getfollowerList(
    followingId: string,
    cursor: string | null
  ): Promise<IFollow[]>;
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

FollowSchema.statics.getfollowingList = function(
  followerId: string,
  cursor: string | null
) {
  const query = Object.assign(
    {},
    cursor
      ? {
          _id: { $lt: cursor },
          follower: followerId,
        }
      : {
          follower: followerId,
        }
  );

  return this.find(query)
    .populate('user')
    .limit(10)
    .lean()
    .exec();
};

FollowSchema.statics.getfollowerList = function(
  followingId: string,
  cursor: string | null
) {
  const query = Object.assign(
    {},
    cursor
      ? {
          _id: { $lt: cursor },
          following: followingId,
        }
      : {
          following: followingId,
        }
  );

  return this.find(query)
    .populate('user')
    .limit(10)
    .lean()
    .exec();
};

const Follow = model<IFollow>('Follow', FollowSchema) as IFollowModel;

export default Follow;
