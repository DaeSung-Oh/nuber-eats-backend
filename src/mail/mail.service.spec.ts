import { Test } from '@nestjs/testing';
import { google, gmail_v1 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import * as mailer from 'nodemailer';
import { CONFIG_OPTIONS } from 'src/common/common.constants';
import { VARS } from './mail.constants';
import { MailService } from './mail.service';

/*
  protected refreshTokenPromises: Map<string, Promise<GetTokenResponse>>;

  interface GetTokenResponse {
    tokens: Credentials;
    res: GaxiosResponse | null;
  }

  export interface GaxiosResponse<T = any> {
      config: GaxiosOptions;
      data: T;
      status: number;
      statusText: string;
      headers: Headers;
      request: GaxiosXMLHttpRequest;
  }

  export interface GaxiosXMLHttpRequest {
    responseURL: string;
  }

  interface Credentials {
     refresh_token?: string | null;
     expiry_date?: number | null;
     access_token?: string | null;
     token_type?: string | null;
     id_token?: string | null;
     scope?: string;
 }
*/
/*
jest.mock('googleapis', () => {
  return {
    google: {
      auth: {
        OAuth2: jest.fn(() => ({
          _clientId: options.gmailClientID,
          _clientSecret: options.gmailSecretKey,
          redirectUri: 'https://testing.google.com',
          refreshTokenPromises: jest.fn(() =>
            Promise.resolve(
              new Map().set('test', {
                tokens: { refresh_token: options.refreshToken },
                res: null,
              }),
            ),
          ),
        })),
      },
    },
  };
});
*/
/*
jest.mock('google-auth-library', () => {
  return {
    OAuth2Client: jest.fn().mockImplementation(() => {
      return {
        _clientId: options.gmailClientID,
        _clientSecret: options.gmailSecretKey,
        redirectUri: 'https://testing.google.com',
        refreshTokenPromises: jest.fn(() =>
          Promise.resolve(
            new Map().set('test', {
              tokens: { refresh_token: options.refreshToken },
              res: null,
            }),
          ),
        ),
      };
    }),
  };
});
*/

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
