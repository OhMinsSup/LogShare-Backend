import { Document, Model, Schema, model } from 'mongoose';
import { IUser } from './User';

export interface IVideo extends Document {
  user: IUser | string;
  video_thumbnail: string;
  title: string;
  description: string;
  tags: string[];
  url: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface IVideoModel extends Model<IVideo> {}

const VideoSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    video_thumbnail: String,
    title: String,
    description: {
      type: String,
    },
    tags: [String],
    url: String,
  },
  { timestamps: true }
);

const Video = model<IVideo>('Video', VideoSchema) as IVideoModel;

export default Video;
