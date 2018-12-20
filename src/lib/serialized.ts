import { pick } from 'lodash';

export const serializePost = (data: any) => {
  const {
    _id: postId,
    title,
    body,
    post_thumbnail,
    createdAt,
    user,
    info,
    liked,
    name,
  } = data;

  return {
    postId,
    post_thumbnail,
    title,
    body,
    liked,
    createdAt,
    tag: name,
    info: {
      ...pick(info, ['likes', 'comments']),
    },
    user: {
      ...pick(user, ['_id']),
      ...pick(user.profile, ['username', 'thumbnail', 'shortBio']),
    },
  };
};

export const serializeVideo = (data: any) => {
  const {
    _id: videoId,
    title,
    description,
    category,
    video_thumbnail,
    video_url,
    format,
    liked,
    info,
    user,
    play_time,
  } = data;

  return {
    videoId,
    title,
    description,
    category,
    format,
    video_thumbnail,
    video_url,
    liked,
    play_time,
    info: {
      ...pick(info, ['likes', 'comments', 'views']),
    },
    user: {
      ...pick(user, ['_id']),
      ...pick(user.profile, ['username', 'thumbnail', 'shortBio']),
    },
  };
};

export const serializeTag = (data: any) => {
  const {
    count,
    tag_docs: { _id: tagId, name },
  } = data;
  return {
    tagId,
    name,
    count,
  };
};

export const serializePoplatePost = (data: any) => {
  const {
    post: { _id: postId, post_thumbnail, info, title, body, user, createdAt },
  } = data;

  return {
    postId,
    title,
    body,
    post_thumbnail,
    createdAt,
    info: {
      ...pick(info, ['likes', 'comments']),
    },
    user: {
      ...pick(user, ['_id']),
      ...pick(user.profile, ['username', 'thumbnail', 'shortBio']),
    },
  };
};

export const serializeNoticeRoom = (data: any) => {
  const { _id: noticeId, creator } = data;

  return {
    noticeId,
    creator: {
      ...pick(creator, ['_id']),
      ...pick(creator.profile, ['username', 'thumbnail', 'shortBio']),
    },
  };
};

export const serializeFollower = (data: any) => {
  const { follower } = data;
  return {
    ...pick(follower, ['_id', 'username']),
    ...pick(follower.profile, ['username', 'thumbnail', 'shortBio']),
  };
};

export const serializeFollowing = (data: any) => {
  const { following } = data;
  return {
    ...pick(following, ['_id']),
    ...pick(following.profile, ['username', 'thumbnail', 'shortBio']),
  };
};

export const serializeUsers = (data: any) => {
  const {
    _id,
    profile: { username, thumbnail, shortBio, cover },
  } = data;
  return {
    _id,
    username,
    thumbnail,
    shortBio,
    cover,
  };
};
