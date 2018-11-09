import { Document, Model, Schema, model } from 'mongoose';
import { IUser } from './User';

export interface IPostSave extends Document {
  user: IUser;
  title: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPostSaveModel extends Model<IPostSave> {
  temporaryPostsList(cursor: string | null): Promise<IPostSave[]>;
}

const PostSaveSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    title: String,
    body: String,
  },
  {
    timestamps: true,
    autoIndex: false,
  }
);

PostSaveSchema.statics.temporaryPostsList = function(cursor: string | null) {
  const query = Object.assign({}, cursor ? { _id: { $lt: cursor } } : {});

  return this.find(query)
    .sort({ _id: -1 })
    .limit(10)
    .lean()
    .exec();
};

const PostSave = model<IPostSave>('PostSave', PostSaveSchema) as IPostSaveModel;

export default PostSave;
