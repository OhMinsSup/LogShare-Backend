import { Document, Model, Schema, model } from 'mongoose';
import { IUser } from './User';
import { IPost } from './Post';

export interface IPostFeeds extends Document {
  user: IUser;
  feed_post: IPost;
}

export interface IPostFeedsModel extends Model<IPostFeeds> {
  createPostFeed: (userId: string, feedPostId: string) => Promise<IPostFeeds>;
}

const schema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    feed_post: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
    },
  },
  {
    timestamps: true,
  }
);

schema.statics.createPostFeed = async function createPostFeed(
  userId: string,
  feedPostId: string
): Promise<IPostFeeds> {
  const PostFeeds: IPostFeedsModel = this;

  try {
    const feedExists = await PostFeeds.findOne({
      $and: [{ user: userId }, { feed_post: feedPostId }],
    }).exec();

    if (feedExists) return;

    const feed = new PostFeeds({
      user: userId,
      feed_post: feedPostId,
    }).save();

    if (!feed) {
      const error = new Error('PostFeedsError');
      error.message = 'PostFeedsNotCreatedError';
      throw error;
    }

    return feed;
  } catch (e) {
    throw e;
  }
};

const PostFeeds = model<IPostFeeds, IPostFeedsModel>('PostFeeds', schema);

export default PostFeeds;
