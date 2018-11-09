import { Document, Model, Schema, model } from 'mongoose';
import { ISeries } from './Series';
import { IPost } from './Post';

export interface ISeriesPost extends Document {
  series: ISeries;
  post: IPost;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISeriesPostModel extends Model<ISeriesPost> {}

const SeriesPostSchema = new Schema(
  {
    series: {
      type: Schema.Types.ObjectId,
      ref: 'Series',
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

const SeriesPost = model<ISeriesPost>(
  'SeriesPost',
  SeriesPostSchema
) as ISeriesPostModel;

export default SeriesPost;
