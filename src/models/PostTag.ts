import { Document, Model, Schema, model, DocumentQuery } from 'mongoose';
import { IPost } from './Post';
import { ITag } from './Tag';

export interface IPostTag extends Document {
  post: IPost | string;
  tag: ITag | string;
}

export interface IPostTagModel extends Model<IPostTag> {
  Link(
    postId: string,
    tagIds: string[]
  ): Promise<DocumentQuery<IPostTag, IPostTag>[]>;
}

const PostTagSchema = new Schema({
  post: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
    index: true,
  },
  tag: {
    type: Schema.Types.ObjectId,
    ref: 'Tag',
    index: true,
  },
});

PostTagSchema.statics.Link = function(postId: string, tagIds: string[]) {
  const promises = tagIds.map(tagId =>
    this.create({
      post: postId,
      tag: tagId,
    })
  );
  return Promise.all(promises);
};

const PostTag = model<IPostTag>('PostTag', PostTagSchema) as IPostTagModel;

export default PostTag;
