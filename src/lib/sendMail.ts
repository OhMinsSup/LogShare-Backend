import * as nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
import { any } from 'joi';
dotenv.config();

const { EMAIL, PASS } = process.env;

type MailType = {
  to: string;
  from: string;
  subject: string;
  html: string;
};

export const sendMail = ({ to, from, subject, html }: MailType) => {
  let transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: EMAIL,
      pass: PASS,
    },
  });

  let mailoptions: nodemailer.SendMailOptions = {
    to,
    from,
    subject,
    html,
  };

  transporter.sendMail(
    mailoptions,
    (err: Error, data: any): void => {
      if (err) {
        console.log(err);
      } else {
        console.log('Message sent: %s', data.messageId);
      }
    }
  );
};
