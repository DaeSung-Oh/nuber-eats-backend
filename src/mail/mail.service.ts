import { Inject, Injectable } from '@nestjs/common';
import { CONFIG_OPTIONS } from 'src/common/common.constants';
import { MailModuleOptions } from './mail.interface';
import * as mailer from 'nodemailer';

@Injectable()
export class MailService {
  transporter: any;

  constructor(
    @Inject(CONFIG_OPTIONS) private readonly options: MailModuleOptions,
  ) {
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

  async sendEmail(to: string) {
    const message = {
      from: this.options.oauthUser,
      to,
      subject: 'GMAIL OAUTH 2.0 테스트',
      html: `
        <h1>
          Nodemailer X Gmail OAuth 2.0 테스트 메일
        </h1>
        <hr />
        <br />
        <div style='background: yellow'>테스트!!!</div>
        <p>축하하네, 구도자여!<p/>
        <p>자네는 모든 시련과 역경을 이겨냈네. 하산하시게나!</p>
        <br />
        <hr />
        <p>이 메일은 Gmail API를 써보고 싶은 정신나간 개발자에 의해서 발송되었습니다.</p>
        <p>이 메일을 요청한 적이 없으시다면 무시하시기 바랍니다.</p>
      `,
    };

    try {
      await this.transporter.sendMail(message);
      console.log('메일발송 성공');
      return { ok: true };
    } catch (e) {
      console.log(e);
      return { ok: false, error: e };
    }
  }
}
