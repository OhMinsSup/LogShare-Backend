import { Document, Model, Schema, model } from 'mongoose';
import { IUser } from './User';
import { IVideo } from './Video';

export interface IVideoRead extends Document {
  user: IUser;
  video: IVideo;
  ip: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IVideoReadModel extends Model<IVideoRead> {
  view(hashIp: string, videoId: string): Promise<IVideoRead>;
}

const VideoReadSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    video: {
      type: Schema.Types.ObjectId,
      ref: 'Video',
    },
    ip: String,
  },
  { timestamps: true }
);

VideoReadSchema.statics.view = function(hashIp: string, videoId: string) {
  return this.findOne({
    $and: [{ ip: hashIp }, { video: videoId }],
  })
    .lean()
    .exec();
};

const VideoRead = model<IVideoRead>(
  'VideoRead',
  VideoReadSchema
) as IVideoReadModel;

export default VideoRead;
