import * as fs from 'fs';
import * as path from 'path';
import * as cheerio from 'cheerio';
import { Inject, Injectable } from '@nestjs/common';
import { CONFIG_OPTIONS } from 'src/common/common.constants';
import {
  EmailTemplate,
  EmailVar,
  MailModuleOptions,
  MailVars,
} from './mail.interface';
import { SendEmailOutput } from './dtos/send-email.dto';
import { VARS } from './mail.constants';

@Injectable()
export class MailService {
  constructor(
    @Inject(CONFIG_OPTIONS) private readonly options: MailModuleOptions,
    @Inject(VARS) private readonly vars: MailVars,
  ) {}

  /**@description read emailTemplateHTML, return message object */
  async createEmailTemplate(
    templateName: EmailTemplate,
    emailVars?: EmailVar[],
  ) {
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

    const $ = cheerio.load(templateHTML, {
      xml: {
        xmlMode: true,
        decodeEntities: true,
        withStartIndices: false,
        withEndIndices: false,
      },
    });

    const message = {
      subject: '',
      html: undefined,
    };

    switch (templateName) {
      case 'welcome':
        message.subject = '[가입]Welcome!';
        break;
      case 'verifyEmail':
        const emailVarsObj: { code?: string; userName?: string } = {};
        emailVars.forEach(({ key, value }) => {
          Object.assign(emailVarsObj, { ...emailVarsObj, [key]: value });
        });
        const { code, userName } = emailVarsObj;
        const titleTag = $('title');
        titleTag.text(`${userName}`);
        const verifyLinkTag = $('#verifyLink');
        verifyLinkTag[0].attribs.href = `http://localhost:3000/${code}`;

        message.subject = '[인증]Verify your Email';
        message.html = $.html();

        break;
      default:
        break;
    }

    return message;
  }

  async sendEmail(
    to: string,
    templateName: EmailTemplate = 'verifyEmail',
    emailVars: EmailVar[],
  ): Promise<SendEmailOutput> {
    // simple Test (Verification Email)
    try {
      switch (to) {
        case 'ods1988@naver.com':
          break;
        case 'dsnaver88@gmail.com':
          break;
        default:
          throw '허용된 이메일이 아닙니다.';
      }

      const { subject, html } = await this.createEmailTemplate(
        templateName,
        emailVars,
      );

      const message = {
        from: this.options.oAuthUser,
        to,
        subject,
        html,
      };

      const result = await this.vars.transporter.sendMail(message);
      console.log('메일발송결과', result);
      return { ok: true };
    } catch (error) {
      return { ok: false, error };
    }
    // try {
    //   const message = {
    //     from: this.options.oAuthUser,
    //     to,
    //     ...(await this.createEmailTemplate(templateName, emailVars)),
    //   };
    //   await this.transporter.sendMail(message);
    //   console.log('메일발송 성공');
    //   return { ok: true };
    // } catch (e) {
    //   console.log(e);
    //   return { ok: false, error: e };
    // }
  }

  async sendVerificationEmail(email: string, code: string) {
    return this.sendEmail(email, 'verifyEmail', [
      { key: 'code', value: code },
      { key: 'userName', value: email },
    ]);
  }

  async sendByGmail(
    to: string,
    templateName: EmailTemplate = 'verifyEmail',
    emailVars: EmailVar[],
  ): Promise<SendEmailOutput> {
    const base64Encoding = (message: string) => {
      const encodingResult = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
      return encodingResult;
    };

    const translateKr = (message: string) => {
      return `=?UTF-8?B?${Buffer.from(message).toString('base64')}?=`;
    };

    // simple test
    try {
      const { subject, html } = await this.createEmailTemplate(
        templateName,
        emailVars,
      );

      const message =
        `To: ${to}\n` +
        `Subject: ${translateKr(subject)}\n` +
        `MIME-Version: 1.0\n` +
        `Content-Type: text/html; charset="UTF-8"\n` +
        `Content-Transfer-Encoding: message/rfc2822\n` +
        `\n` +
        `${html}\n`;

      const res = await this.vars.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: base64Encoding(message),
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

  async sendVerificationEmailByGmail(email: string, code: string) {
    return this.sendByGmail(email, 'verifyEmail', [
      { key: 'code', value: code },
      { key: 'userName', value: email },
    ]);
  }
}
