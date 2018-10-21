import { pick } from 'lodash';

/**
 * @description 포스트 데이터에서 필요한 데이터만 필터링
 * @param {any} Data(포스트의 속성과 유저 속성을 가져온다)
 * @returns {Object<any>} _id, post_thumbnail, title, body, createdAt, tags, user, info
 */
export const serializePost = (data: any) => {
  const {
    _id,
    title,
    body,
    post_thumbnail,
    createdAt,
    user,
    info,
    liked,
  } = data;
  return {
    _id,
    post_thumbnail,
    title,
    body,
    liked,
    createdAt,
    info: {
      ...pick(info, ['likes', 'comments']),
    },
    user: {
      ...pick(user, ['_id']),
      ...pick(user.profile, ['username', 'thumbnail']),
    },
  };
};
