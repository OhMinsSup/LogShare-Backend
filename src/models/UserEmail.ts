import { Schema, model, Document, Model } from 'mongoose';
import * as shortid from 'shortid';

export interface IUserEmail extends Document {
  code: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserEmailModel extends Model<IUserEmail> {
  findCode(code: string): Promise<IUserEmail>;
  use(code: string): Promise<IUserEmail>;
}

const schema = new Schema(
  {
    code: {
      type: String,
      unique: true,
      default: shortid.generate,
    },
    email: String,
  },
  { timestamps: true }
);

schema.statics.findCode = function(code: string) {
  return this.findOne({
    code,
    logged: false,
  })
    .lean()
    .exec();
};

schema.statics.use = function(code: string) {
  return this.findOneAndUpdate(
    code,
    {
      $set: {
        logged: true,
      },
    },
    { new: true }
  )
    .lean()
    .exec();
};

const UserEmail = model<IUserEmail, IUserEmailModel>('UserEmail', schema);

export default UserEmail;
