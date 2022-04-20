import { Test } from '@nestjs/testing';
import { google } from 'googleapis';
import * as mailer from 'nodemailer';
import { CONFIG_OPTIONS } from 'src/common/common.constants';
import { VARS } from './mail.constants';
import { MailService } from './mail.service';

jest.mock('googleapis');
jest.mock('nodemailer');

const options = {
  apiKey: 'Gmail.api.Key',
  oAuthUser: 'Google.oAuthUser',
  refreshToken: 'RefreshToken',
  gmailClientID: 'Gmail.client.id',
  gmailSecretKey: 'Gmail.SecretKey',
};

describe('Mail Service', () => {
  let service: MailService;

  beforeEach(async () => {
    const vars = {
      oAuth2Client: undefined,
      transporter: undefined,
      gmail: undefined,
    };

    vars.oAuth2Client = new google.auth.OAuth2(
      options.gmailClientID,
      options.gmailSecretKey,
      'https://test.redirect.com',
    );
    vars.oAuth2Client.setCredentials({ refresh_token: options.refreshToken });

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

    const module = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: CONFIG_OPTIONS,
          useValue: options,
        },
        {
          provide: VARS,
          useValue: vars,
        },
      ],
    }).compile();

    console.log(vars);

    service = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
