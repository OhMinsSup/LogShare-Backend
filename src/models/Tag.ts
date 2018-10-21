import { Document, Model, Schema, model, DocumentQuery } from 'mongoose';

export interface ITag extends Document {
  name: string;
}

export interface ITagModel extends Model<ITag> {
  getTagId(name: string): Promise<string>;
  bulkGetNewId(names: string[]): Promise<string[]>;
  bulkGetMissingId(names: string[]): Promise<string[]>;
  findByTagName(name: string): Promise<DocumentQuery<ITag, ITag>>;
}

const TagSchema = new Schema({
  name: {
    type: String,
    lowercase: true,
  },
});

TagSchema.statics.getTagId = async function(name: string) {
  try {
    let tag = await this.findOne({
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

TagSchema.statics.bulkGetNewId = async function(names: string[]) {
  if (names.length === 0) return;

  try {
    const tagData = await this.find({
      name: names,
    })
      .lean()
      .exec();

    const missingTags = names.filter(
      name => tagData.findIndex(tag => tag.name === name) === -1
    );
    const newTagIds: string[] = (await this.create(
      missingTags.map(name => ({ name }))
    )).map((tag: ITag) => tag._id);

    return newTagIds.map(tag => tag);
  } catch (e) {
    throw e;
  }
};

TagSchema.statics.bulkGetMissingId = async function(names: string[]) {
  if (names.length === 0) return;

  try {
    const tagData = await this.find({
      $and: [
        {
          name: names,
        },
      ],
    })
      .lean()
      .exec();

    const tagIds = tagData.map(tag => tag._id);
    return tagIds;
  } catch (e) {
    throw e;
  }
};

TagSchema.statics.findByTagName = function(name: string) {
  return this.findOne({
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
              (name.replace('/s$', null) || name.replace('/-/', null)) && name,
          },
        ],
      },
    ],
  })
    .lean()
    .exec();
};

const Tag = model<ITag>('Tag', TagSchema) as ITagModel;

export default Tag;
