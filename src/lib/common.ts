import * as crypto from 'crypto';

/**
 * @description 패스워드를 해시값으로 변경
 * @param {string} password
 * @returns {string} password
 */
export const hash = (password: string): string => {
  return crypto
    .createHmac('sha256', 'ds')
    .update(password)
    .digest('hex');
};
