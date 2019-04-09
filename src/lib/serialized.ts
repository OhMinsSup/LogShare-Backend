import { pick } from 'lodash';

export const serializePost = (data: any) => {
  const { _id: postId, title, body, post_thumbnail, createdAt, user, info, liked, name } = data;

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
