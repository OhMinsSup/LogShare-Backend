import { Document, Model, Schema, model, DocumentQuery } from 'mongoose';

export interface ITag extends Document {
  name: string;
}

export interface ITagModel extends Model<ITag> {
  getTagId(name: string): Promise<string>;
}

const TagSchema = new Schema({
  name: {
    type: String,
    lowercase: true,
  },
});

TagSchema.statics.getTagId = async function(name: string) {
  try {
    let tag: ITag = await this.findOne({
      $and: [
        {
          $or: [{ name: name.toLowerCase() }, { name }],
        },
        {
          $or: [
            {
              name:
                (name.replace('/s$', null) || name.replace('/-/', null)) &&
                name.toLowerCase(),
            },
            {
              name:
                (name.replace('/s$', null) || name.replace('/-/', null)) &&
                name,
            },
          ],
        },
      ],
    })
      .lean()
      .exec();

    if (!tag) {
      tag = await this.create({
        name,
      });

      return tag._id;
    }

    return tag._id;
  } catch (e) {
    throw e;
  }
};

const Tag = model<ITag>('Tag', TagSchema) as ITagModel;

export default Tag;
