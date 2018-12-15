import { Document, Model, Schema, model, DocumentQuery } from 'mongoose';
import { IUser } from './User';

export interface IVideo extends Document {
  user: IUser;
  video_thumbnail: string;
  video_url: string;
  title: string;
  description: string;
  category: string;
  play_time: string;
  info: {
    views: number;
    score: number;
    likes: number;
    comments: number;
  };
  format: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface IVideoModel extends Model<IVideo> {
  listVideos(userId: string | null, cursor: string | null): Promise<IVideo[]>;
  viewVideoById(videoId: string): Promise<IVideo>;
  Count(type: 'likes' | 'comments', videoId: string): Promise<IVideo>;
  unCount(type: 'likes' | 'comments', videoId: string): Promise<IVideo>;
  score(
    userId: IUser,
    videoId: string
  ): Promise<DocumentQuery<IVideo, IVideo, {}>>;
}

const VideoSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    video_thumbnail: String,
    title: String,
    description: String,
    video_url: String,
    category: {
      type: String,
      enum: [
        '개발',
        '사진',
        '비즈니스',
        '디자인',
        '음악',
        '자기개발',
        '사무',
        '생활',
        '뷰티',
        '기타',
      ],
      default: '기타',
    },
    play_time: String,
    info: {
      views: {
        type: Number,
        default: 0,
      },
      score: {
        type: Number,
        default: 0,
      },
      likes: {
        type: Number,
        default: 0,
      },
      comments: {
        type: Number,
        default: 0,
      },
    },
    format: {
      type: String,
      default: 'mp4',
    },
  },
  { timestamps: true }
);

VideoSchema.statics.listVideos = function(
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
    .populate('user', 'profile')
    .sort({ _id: -1 })
    .limit(10)
    .lean()
    .exec();
};

VideoSchema.statics.viewVideoById = function(videoId: string) {
  return this.findById(videoId)
    .populate('user')
    .lean()
    .exec();
};

VideoSchema.statics.score = function(userId: IUser, videoId: string) {
  return this.findOneAndUpdate(
    {
      $and: [{ user: userId }, { _id: videoId }],
    },
    {
      $inc: [{ 'info.views': 1 }, { 'info.score': 1 }],
    },
    {
      new: true,
    }
  )
    .lean()
    .exec();
};

VideoSchema.statics.Count = function(
  type: 'likes' | 'comments',
  videoId: string
) {
  const key = `info.${type}`;

  return this.findByIdAndUpdate(
    videoId,
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

VideoSchema.statics.unCount = function(
  type: 'likes' | 'comments',
  videoId: string
) {
  const key = `info.${type}`;

  return this.findByIdAndUpdate(
    videoId,
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

const Video = model<IVideo>('Video', VideoSchema) as IVideoModel;

export default Video;
