import { Injectable } from '@nestjs/common';
const nodemailer = require('nodemailer');
const mg = require('nodemailer-mailgun-transport');
let nodemailerMailgun;

@Injectable()
export class MailerService {
  constructor() {
    const auth = {
      auth: {
        api_key: process.env.MAILGUN_API_KEY,
        domain: process.env.MAILGUN_DOMAIN_NAME
      },
      host: process.env.MAILGUN_HOST
    }
    nodemailerMailgun = nodemailer.createTransport(mg(auth));
  }

  sendActivationLink(user: any, userId: string, token: string) {
    const URL = `${process.env.PROTOCOL}://${process.env.FRONTEND}/verify?userId=${userId}&token=${token}`;
    nodemailerMailgun.sendMail({
      from: 'from@mail.com',
      to: user.email, // An array if you have multiple recipients.
      subject: 'A nice Subject',
      // 'h:Reply-To': 'from@mail.com',
      html: `<h2>Hi ${user.username},</h2><h3>Click here to verify your account:</h3><a href="${URL} ">${URL}</a>`,
    }, (err: { status: number, details: string }, info: { id: string, message: string, messageId: string }) => {
      if (err) {
        console.log(`${err} Details: ${err.details} Status: ${err.status}`);
      }
      // else {
      //   console.log(`Response: ${info.message} with ID: ${info.messageId}`);
      // }
    });
  }
}