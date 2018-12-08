import { Schema, model, Model, Document } from 'mongoose';
import { IUser } from './User';
import { IVideo } from './Video';

export interface IVideoLike extends Document {
  user: IUser;
  video: IVideo;
}

export interface IVideoLikeModel extends Model<IVideoLike> {
  checkExists(userId: string, videoId: string): Promise<IVideoLike>;
}

const VideoLikeSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    video: {
      type: Schema.Types.ObjectId,
      ref: 'Video',
    },
  },
  {
    timestamps: true,
  }
);

VideoLikeSchema.statics.checkExists = function(
  userId: string,
  videoId: string
) {
  return this.findOne({
    $and: [{ user: userId }, { video: videoId }],
  })
    .lean()
    .exec();
};

const VideoLike = model<IVideoLike>(
  'VideoLike',
  VideoLikeSchema
) as IVideoLikeModel;

export default VideoLike;
