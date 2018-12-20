import { Model, Document, Schema, model } from 'mongoose';
import { IVideo } from './Video';
import { IUser } from './User';

export interface IVideoComment extends Document {
  video: IVideo;
  user: IUser;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IVideoCommentModel extends Model<IVideoComment> {
  getCommentList(videoId: string): Promise<IVideoComment[]>;
}

const VideoCommentSchema = new Schema(
  {
    video: {
      type: Schema.Types.ObjectId,
      ref: 'Video',
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    text: String,
  },
  {
    timestamps: true,
  }
);

VideoCommentSchema.statics.getCommentList = function(videoId: string) {
  const query = Object.assign({}, { video: videoId });

  return this.find(query)
    .populate('user')
    .sort({ _id: -1 })
    .lean()
    .exec();
};

const VideoComment = model<IVideoComment>(
  'VideoComment',
  VideoCommentSchema
) as IVideoCommentModel;

export default VideoComment;
