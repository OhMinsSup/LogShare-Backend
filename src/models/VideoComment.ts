import { Model, Document, Schema, model } from 'mongoose';

export interface IVideoComment extends Document {}

export interface IVideoCommentModel extends Model<IVideoComment> {}

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

const VideoComment = model<IVideoComment>(
  'VideoComment',
  VideoCommentSchema
) as IVideoCommentModel;

export default VideoComment;
