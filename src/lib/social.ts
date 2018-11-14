import { google } from 'googleapis';
const FacebookAPI = require('fb');
import * as dotenv from 'dotenv';
dotenv.config();

export type Profile = {
  id: number | string;
  thumbnail: string | null;
  email: string | null;
  name: string | null;
};

const profileGetter = {
  facebook(accessToken: string): Promise<Profile> {
    return FacebookAPI.api('me', {
      fields: ['name', 'email', 'picture'],
      access_token: accessToken,
    }).then(auth => {
      return {
        id: auth.id,
        name: auth.name,
        email: auth.email || null,
        thumbnail: auth.picture.data.url,
      };
    });
  },
  google(accessToken: string): Promise<Profile> {
    const plus = google.plus({
      version: 'v1',
      auth: process.env.GOOGLE_SECRET,
    });
    return new Promise((resolve, reject) => {
      plus.people.get(
        {
          userId: 'me',
          auth: accessToken,
        },
        (err, auth) => {
          if (err) {
            reject(err);
            return;
          }
          const { id, image, emails, displayName } = auth.data;

          const profile = {
            id,
            thumbnail: image.url,
            email: emails[0].value,
            name: displayName && displayName.split(' (')[0],
          };
          resolve(profile);
        }
      );
    });
  },
};

export default function Social(provier: string, accessToken: string) {
  return profileGetter[provier](accessToken);
}
