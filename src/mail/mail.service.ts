import * as fs from 'fs';
import * as path from 'path';
import { Inject, Injectable } from '@nestjs/common';
import { CONFIG_OPTIONS } from 'src/common/common.constants';
import { EmailTemplate, MailModuleOptions } from './mail.interface';
import * as mailer from 'nodemailer';
import { gmail_v1, google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class MailService {
  transporter: any;
  oAuth2Client: OAuth2Client;
  gmail: gmail_v1.Gmail;

  constructor(
    @Inject(CONFIG_OPTIONS) private readonly options: MailModuleOptions,
  ) {
    this.oAuth2Client = new google.auth.OAuth2(
      options.gmailClientID,
      options.gmailSecretKey,
      'https://developers.google.com/oauthplayground',
    );
    this.oAuth2Client.setCredentials({
      refresh_token: options.refreshToken,
    });
    this.gmail = google.gmail({
      version: 'v1',
      auth: this.oAuth2Client,
    });

    this.transporter = mailer.createTransport({
      service: 'gmail',
      host: 'smtp.google.com',
      port: 587,
      secure: true,
      auth: {
        type: 'OAuth2',
        user: options.oauthUser,
        clientId: options.gmailClientID,
        clientSecret: options.gmailSecretKey,
        refreshToken: options.refreshToken,
      },
    });
  }

  async getEmailTemplate(templateName: EmailTemplate) {
    const templatePath = path.join(
      __dirname.replace('\\dist\\mail', ''),
      '/src',
      '/mail',
      '/templates',
      `/${templateName}.html`,
    );
    const templateHTML = await fs.readFileSync(templatePath, {
      encoding: 'utf-8',
    });
    const [startIndex, endIndex] = [
      templateHTML.indexOf('<body>') + '<body>'.length + 2,
      templateHTML.indexOf('</body>') - 4,
    ];

    const message = {
      subject: '',
      html: templateHTML.substring(startIndex, endIndex),
    };

    switch (templateName) {
      case 'welcome':
        message.subject = '[가입]Welcome!';
        break;
      case 'verifyEmail':
        message.subject = '[인증]Verify your Email';
        break;
      default:
        break;
    }
    return message;
  }

  async sendEmail(to: string, templateName: EmailTemplate = 'verifyEmail') {
    // simple Test
    try {
      const message = {
        from: this.options.oauthUser,
        to,
        ...(await this.getEmailTemplate(templateName)),
      };
      await this.transporter.sendMail(message);
      console.log('메일발송 성공');
      return { ok: true };
    } catch (e) {
      console.log(e);
      return { ok: false, error: e };
    }
  }

  async sendByGmail(to: string, templateName: EmailTemplate = 'verifyEmail') {
    // simple test
    try {
      const { subject, html } = await this.getEmailTemplate(templateName);

      const message =
        `To: ${to}\n` +
        `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=\n` +
        `MIME-Version: 1.0\n` +
        `Content-Type: text/html; charset="UTF-8"\n` +
        `Content-Transfer-Encoding: message/rfc2822\n` +
        `\n` +
        `${html}\n`;
      const data = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

      const res = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: data,
        },
      });
      console.log(res);
      return {
        ok: true,
      };
    } catch (e) {
      console.log(e);
      return { ok: false, error: e };
    }
  }
}
