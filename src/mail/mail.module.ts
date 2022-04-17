import { DynamicModule, Global, Module } from '@nestjs/common';
import { google } from 'googleapis';
import * as mailer from 'nodemailer';
import { CONFIG_OPTIONS } from 'src/common/common.constants';
import { VARS } from './mail.constants';
import { MailModuleOptions, MailVars } from './mail.interface';
import { MailService } from './mail.service';

@Module({
  providers: [MailService],
})
@Global()
export class MailModule {
  static forRoot(options: MailModuleOptions): DynamicModule {
    const vars: MailVars = {
      oAuth2Client: undefined,
      transporter: undefined,
      gmail: undefined,
    };
    vars.oAuth2Client = new google.auth.OAuth2(
      options.gmailClientID,
      options.gmailSecretKey,
      'https://developers.google.com/oauthplayground',
    );
    vars.oAuth2Client.setCredentials({
      refresh_token: options.refreshToken,
    });
    vars.gmail = google.gmail({
      version: 'v1',
      auth: vars.oAuth2Client,
    });
    vars.transporter = mailer.createTransport({
      service: 'gmail',
      host: 'smtp.google.com',
      port: 587,
      secure: true,
      auth: {
        type: 'OAuth2',
        user: options.oAuthUser,
        clientId: options.gmailClientID,
        clientSecret: options.gmailSecretKey,
        refreshToken: options.refreshToken,
      },
    });

    return {
      module: MailModule,
      exports: [MailService],
      providers: [
        {
          provide: CONFIG_OPTIONS,
          useValue: options,
        },
        {
          provide: VARS,
          useValue: vars,
        },
        MailService,
      ],
    };
  }
}
