import * as fs from 'fs';
import * as path from 'path';
import * as cheerio from 'cheerio';
import { Inject, Injectable } from '@nestjs/common';
import { CONFIG_OPTIONS } from 'src/common/common.constants';
import {
  MailModuleOptions,
  MailConfig,
  WelcomeEmailVar,
  VerfificationEmailVar,
  EmailTemplateVarsType,
  MessageConfig,
} from './mail.interface';
import { EmailTemplateName, SendEmailOutput } from './dtos/send-email.dto';
import {
  MAIL_CONFIG,
  VERIFICATION_EMAIL_SUBJECT,
  WELCOME_EMAIL_SUBJECT,
} from './mail.constants';
import {
  asObjectType,
  base64Encoding,
  translateKr,
} from 'src/common/core.util';

// eslint-disable-next-line
const chalk = require('chalk');

@Injectable()
export class MailService {
  constructor(
    @Inject(CONFIG_OPTIONS) private readonly options: MailModuleOptions,
    @Inject(MAIL_CONFIG) private readonly mailConfig: MailConfig,
  ) {}

  /**@description read emailTemplateHTML, return parsed html to string */
  async createEmailTemplate(
    templateName: EmailTemplateName,
    emailVars: EmailTemplateVarsType,
  ): Promise<string> {
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

    if (
      templateName === EmailTemplateName.WelcomeEmail &&
      asObjectType<WelcomeEmailVar>(emailVars)
    ) {
      // sendEmail: createAccount Welcome
    } else if (
      templateName === EmailTemplateName.VerificationEmail &&
      asObjectType<VerfificationEmailVar>(emailVars)
    ) {
      // sendEmail: createAccount, editProfile Verfication
      const { code, userEmail } = emailVars;

      const titleTag = $('title');
      titleTag.text(`${userEmail}`);

      const verifyLinkTag = $('#verifyLink');
      verifyLinkTag[0].attribs.href = `http://localhost:3000/${code}`;
    }

    return $.html();
  }

  async sendEmail(
    to: string,
    templateName: EmailTemplateName = EmailTemplateName.VerificationEmail,
    emailVars: EmailTemplateVarsType,
  ): Promise<SendEmailOutput> {
    try {
      // limit send to email
      switch (to) {
        case 'ods1988@naver.com':
          break;
        case 'dsnaver88@gmail.com':
          break;
        default:
          throw '허용된 이메일이 아닙니다.';
      }

      const html = await this.createEmailTemplate(templateName, emailVars);
      const subject =
        templateName === EmailTemplateName.WelcomeEmail
          ? WELCOME_EMAIL_SUBJECT(to)
          : VERIFICATION_EMAIL_SUBJECT(to);
      const message: MessageConfig = {
        from: this.options.oAuthUserEmail,
        to,
        subject,
        html,
      };

      const result = await this.mailConfig.transporter.sendMail(message);

      return { ok: true, res_string: JSON.stringify(result, null, 2) };
    } catch (error) {
      throw error;
    }
  }

  async sendWelcomEmail(email: string): Promise<SendEmailOutput> {
    try {
      return this.sendEmail(email, EmailTemplateName.WelcomeEmail, {
        userEmail: email,
      });
    } catch (error) {
      throw error;
    }
  }

  async sendVerificationEmail(
    email: string,
    code: string,
  ): Promise<SendEmailOutput> {
    try {
      return this.sendEmail(email, EmailTemplateName.VerificationEmail, {
        userEmail: email,
        code,
      });
    } catch (error) {
      throw error;
    }
  }

  async sendByGmail(
    to: string,
    templateName: EmailTemplateName = EmailTemplateName.VerificationEmail,
    emailVars: EmailTemplateVarsType,
  ): Promise<SendEmailOutput> {
    try {
      const html = await this.createEmailTemplate(templateName, emailVars);
      const subject =
        templateName === EmailTemplateName.WelcomeEmail
          ? WELCOME_EMAIL_SUBJECT(to)
          : VERIFICATION_EMAIL_SUBJECT(to);
      const message =
        `To: ${to}\n` +
        `Subject: ${translateKr(subject)}\n` +
        `MIME-Version: 1.0\n` +
        `Content-Type: text/html; charset="UTF-8"\n` +
        `Content-Transfer-Encoding: message/rfc2822\n` +
        `\n` +
        `${html}\n`;

      const res = await this.mailConfig.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: base64Encoding(message),
        },
      });

      return {
        ok: true,
        res_string: JSON.stringify(res, null, 2),
      };
    } catch (error) {
      throw error;
    }
  }

  async sendVerificationEmailByGmail(email: string, code: string) {
    return this.sendByGmail(email, EmailTemplateName.VerificationEmail, {
      userEmail: email,
      code,
    });
  }
}
