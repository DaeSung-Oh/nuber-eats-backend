import { Test } from '@nestjs/testing';
import { google } from 'googleapis';
import * as mailer from 'nodemailer';
import { CONFIG_OPTIONS } from 'src/common/common.constants';
import { VARS } from './mail.constants';
import { MailService } from './mail.service';

const options = {
  apiKey: 'Gmail.api.Key',
  oAuthUser: 'Google.oAuthUser',
  refreshToken: 'RefreshToken',
  gmailClientID: 'Gmail.client.id',
  gmailSecretKey: 'Gmail.SecretKey',
};

jest.mock('googleapis', () => {
  return {
    google: {
      auth: {
        OAuth2: jest.fn(function (id, secret, uri) {
          return {
            ...this,
            _clientId: id,
            _clientSecret: secret,
            redirectUri: uri,
            setCredentials: jest.fn(function (credential) {
              this.credentials = { ...this.credentials, ...credential };
            }),
          };
        }),
      },
    },
  };
});
jest.mock('nodemailer');

describe('Mail Service', () => {
  let service: MailService;

  const vars = {
    oAuth2Client: undefined,
    transporter: undefined,
    gmail: undefined,
  };

  beforeEach(async () => {
    vars.oAuth2Client = new google.auth.OAuth2(
      options.gmailClientID,
      options.gmailSecretKey,
      'https://www.test.com',
    );
    vars.oAuth2Client.setCredentials({ refresh_token: options.refreshToken });
    // vars.gmail = google.gmail({
    //   version: 'v1',
    //   auth: vars.oAuth2Client,
    // });

    // vars.transporter = mailer.createTransport({
    //   service: 'gmail',
    //   host: 'smtp.google.com',
    //   port: 587,
    //   secure: true,
    //   auth: {
    //     type: 'OAuth2',
    //     user: options.oAuthUser,
    //     clientId: options.gmailClientID,
    //     clientSecret: options.gmailSecretKey,
    //     refreshToken: options.refreshToken,
    //   },
    // });

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

    service = module.get<MailService>(MailService);
  });

  describe('should be defined (service, vars)', () => {
    it('should be defined(service)', () => {
      expect(service).toBeDefined();
    });

    it('should be defined(vars)', () => {
      expect(vars.oAuth2Client._clientId).toBe(options.gmailClientID);
      expect(vars.oAuth2Client._clientSecret).toBe(options.gmailSecretKey);
      expect(vars.oAuth2Client.redirectUri).toBe('https://www.test.com');
      expect(vars.oAuth2Client.credentials['refresh_token']).toBe(
        options.refreshToken,
      );
    });
  });
});
