import { Document, Model, Schema, model } from 'mongoose';
import { IUser } from './User';

export interface ISeries extends Document {
  user: IUser;
  series_thumbnail: string;
  title: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISeriesModel extends Model<ISeries> {}

const SeriesSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    series_thumbnail: String,
    title: String,
    description: String,
  },
  {
    timestamps: true,
  }
);

const Series = model<ISeries>('Series', SeriesSchema) as ISeriesModel;

export default Series;
