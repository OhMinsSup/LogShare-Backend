import { google } from 'googleapis';
const Facebook = require('fb');
const Github = require('github');

export type Profile = {
  id: number | string;
  thumbnail: string | null;
  email: string | null;
  name: string | null;
};

const profileGetter = {
  github(accessToken: string): Promise<Profile> {
    const github = new Github();
    github.authenticate({
      type: 'token',
      token: accessToken,
    });
    return new Promise((resolve, reject) => {
      github.users.get({}, (err, res) => {
        if (err) {
          reject(err);
          return;
        }

        const { id, avatar_url: thumbnail, email, name } = res.data;

        const profile = {
          id,
          thumbnail,
          email,
          name,
        };

        resolve(profile);
      });
    });
  },
  facebook(accessToken: string): Promise<Profile> {
    return Facebook.api('me', {
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
      url: 'https://www.googleapis.com/plus/v1/people/',
      params: {
        access_token: accessToken,
      },
    });
    return new Promise((resolve, reject) => {
      plus.people.get(
        {
          userId: 'me',
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

export default function Social(provier: string, accessToken: string): Promise<Profile> {
  return profileGetter[provier](accessToken);
}
