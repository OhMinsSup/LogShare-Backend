import { Document, Model, Schema, model, DocumentQuery } from 'mongoose';
import { IUser } from './User';

export interface IPost extends Document {
  user: IUser;
  post_thumbnail: string;
  title: string;
  body: string;
  info: {
    likes: number;
    comments: number;
    score: number;
  };
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface IPostModel extends Model<IPost> {
  readPostById(postId: string): Promise<IPost>;
  listPosts(userId: string | null, cursor: string | null): Promise<IPost[]>;
  trendingPostList(cursor: string | null): Promise<IPost[]>;
  Count(type: 'likes' | 'comments', postId: string): Promise<IPost>;
  unCount(type: 'likes' | 'comments', postId: string): Promise<IPost>;
}

const PostSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    post_thumbnail: String,
    title: String,
    body: String,
    info: {
      likes: {
        type: Number,
        default: 0,
      },
      comments: {
        type: Number,
        default: 0,
      },
      score: {
        type: Number,
        default: 0,
      },
    },
  },
  { timestamps: true, autoIndex: false }
);

PostSchema.index({ _id: -1 });

PostSchema.statics.readPostById = function(postId: string) {
  return this.findById(postId)
    .populate('user')
    .lean()
    .exec();
};

PostSchema.statics.trendingPostList = function(cursor: string | null) {
  const query = Object.assign({}, cursor ? { _id: { $lt: cursor } } : {});

  return this.find(query)
    .populate('user')
    .sort({ 'info.score': -1 })
    .limit(10)
    .lean()
    .exec();
};

PostSchema.statics.listPosts = function(
  userId: string | null,
  cursor: string | null
) {
  const query = Object.assign(
    {},
    cursor && !userId ? { _id: { $lt: cursor } } : {},
    userId && !cursor ? { user: userId } : {},
    userId && cursor ? { _id: { $lt: cursor }, user: userId } : {}
  );

  return this.find(query)
    .populate('user')
    .sort({ _id: -1 })
    .limit(10)
    .lean()
    .exec();
};

PostSchema.statics.Count = function(
  type: 'likes' | 'comments',
  postId: string
) {
  const key = `info.${type}`;

  return this.findByIdAndUpdate(
    postId,
    {
      $inc: {
        [key]: 1,
      },
    },
    { new: true }
  )
    .lean()
    .exec();
};

PostSchema.statics.unCount = function(
  type: 'likes' | 'comments',
  postId: string
) {
  const key = `info.${type}`;

  return this.findByIdAndUpdate(
    postId,
    {
      $inc: {
        [key]: -1,
      },
    },
    { new: true }
  )
    .lean()
    .exec();
};

const Post = model<IPost>('Post', PostSchema) as IPostModel;

export default Post;
