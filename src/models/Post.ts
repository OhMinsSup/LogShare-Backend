import { Document, Model, Schema, model, DocumentQuery } from 'mongoose';
import { IUser } from './User';

export interface IPost extends Document {
  user: IUser;
  post_thumbnail: string;
  title: string;
  body: string;
  tags: string[];
  info: {
    likes: number;
    comments: number;
    score: number;
  };
  createdAt: Date;
  updatedAt: Date;
  count(count: number): Promise<any>;
  likes(calc: boolean): Promise<any>;
  comments(calc: boolean): Promise<any>;
}

export interface IPostModel extends Model<IPost> {
  readPostById: (postId: string) => Promise<IPost>;
  countSearchPosts: (query: string) => Promise<number>;
  searchPosts: (query: string, page: number) => Promise<IPost[]>;
}

const schema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    post_thumbnail: String,
    title: String,
    body: String,
    tags: [String],
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
  {
    timestamps: true,
  }
);

schema.index({ user: -1, _id: -1 });
schema.index(
  { title: 'text', body: 'text', tags: 'text' },
  { weights: { title: 3, tags: 2, body: 1 } }
);

schema.statics.readPostById = function readPostById(postId: string): Promise<IPost> {
  const Post: IPostModel = this;
  return Post.findOne({
    _id: postId,
  })
    .sort({ _id: -1 })
    .populate('user')
    .exec();
};

schema.methods.comments = function comments(calc: boolean = true): Promise<any> {
  const result = calc ? 1 : -1;
  const key = `info.comments`;
  const query = {
    $inc: {
      [key]: result,
    },
  };
  return this.update(query).exec();
};

schema.methods.likes = function likes(calc: boolean = true): Promise<any> {
  const result = calc ? 1 : -1;
  const key = `info.likes`;
  const query = {
    $inc: {
      [key]: result,
    },
  };
  return this.update(query).exec();
};

schema.methods.count = function count(count: number): Promise<any> {
  const key = `info.score`;
  const query = {
    $inc: {
      [key]: count,
    },
  };
  return this.update(query).exec();
};

schema.statics.searchPosts = function searchPosts(query: string, page: number): Promise<IPost[]> {
  const Post: IPostModel = this;
  return Post.find({
    $text: {
      $search: query,
    },
  })
    .sort({ _id: -1 })
    .limit(10)
    .skip((page - 1) * 10)
    .populate('user')
    .exec();
};

schema.statics.countSearchPosts = function countSearchPosts(query: string): Promise<number> {
  const Post: IPostModel = this;
  return Post.find({
    $text: {
      $search: query,
    },
  })
    .sort({ _id: -1 })
    .countDocuments()
    .exec();
};

const Post = model<IPost, IPostModel>('Post', schema);

export default Post;
