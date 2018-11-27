import { Document, Model, Schema, model, DocumentQuery, Query } from 'mongoose';
import { IPost } from './Post';
import Tag, { ITag } from './Tag';

export interface IPostTag extends Document {
  post: IPost;
  tag: ITag;
}

export interface IPostTagModel extends Model<IPostTag> {
  Link(postId: string, tagIds: string[]): Promise<IPostTag[]>;
  addTagsToPost(postId: string, tags: string[]): Promise<IPostTag>;
  removeTagsPost(postId: string, tags: string[]): Promise<Query<IPostTag>>;
  getTagNames(postId: string): Promise<IPostTag[]>;
}

const PostTagSchema = new Schema({
  post: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
  },
  tag: {
    type: Schema.Types.ObjectId,
    ref: 'Tag',
  },
});

PostTagSchema.statics.Link = function(postId: string, tagIds: string[]) {
  const promises: IPostTag[] = tagIds.map(tagId =>
    this.create({
      post: postId,
      tag: tagId,
    })
  );
  return Promise.all(promises);
};

PostTagSchema.statics.addTagsToPost = async function(
  postId: string,
  tags: string[]
) {
  if (tags.length === 0) return;

  try {
    const tagIds: string[] = await Tag.bulkGetNewId(tags);

    return await this.create(
      tagIds.map(tagId => ({ post: postId, tag: tagId }))
    );
  } catch (e) {
    throw e;
  }
};

PostTagSchema.statics.removeTagsPost = async function(
  postId: string,
  tags: string[]
) {
  if (tags.length === 0) return;

  try {
    const tagIds: string[] = await Tag.bulkGetMissingId(tags);
    return await this.deleteMany({
      $and: [
        {
          $or: [{ post: postId }, { tag: tagIds }],
        },
      ],
    })
      .lean()
      .exec();
  } catch (e) {
    throw e;
  }
};

PostTagSchema.statics.getTagNames = function(postId: string) {
  if (!postId) return;

  return this.find({
    post: postId,
  })
    .populate({
      path: 'tag',
      select: 'name',
    })
    .lean()
    .exec();
};

const PostTag = model<IPostTag>('PostTag', PostTagSchema) as IPostTagModel;

export default PostTag;
