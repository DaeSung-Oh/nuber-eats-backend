import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { google } from 'googleapis';
import * as mailer from 'nodemailer';
import { CONFIG_OPTIONS } from 'src/common/common.constants';
import { MAIL_CONFIG } from './mail.constants';
import { MailConfig, MailModuleOptions } from './mail.interface';
import { MailService } from './mail.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoogleOAuth2Token } from 'src/auth/entities/googleOAuth2Token.entity';
import { getConnection } from 'typeorm';
import { parseDate } from 'src/common/core.util';

// for use chalk (not import from, use require)
// eslint-disable-next-line
const chalk = require('chalk');

@Module({
  imports: [TypeOrmModule.forFeature([GoogleOAuth2Token])],
  providers: [MailService],
})
@Global()
export class MailModule {
  static forRootAsync(options: MailModuleOptions): DynamicModule {
    const init = (options: MailModuleOptions) =>
      new Promise<MailConfig>(async (resolve, reject) => {
        const connection = await getConnection().connect();
        const oAuth2TokenRepository =
          connection.getRepository(GoogleOAuth2Token);

        const oAuth2Client = new google.auth.OAuth2(
          options.gmailClientID,
          options.gmailSecretKey,
          'https://developers.google.com/oauthplayground',
        );

        const exist_tokens = await oAuth2TokenRepository.findOne();

        oAuth2Client.on('tokens', async tokens => {
          console.log(chalk.yellow('on Tokens Event'));
          try {
            exist_tokens
              ? await oAuth2TokenRepository.save([
                  {
                    ...exist_tokens,
                    access_token: tokens?.access_token,
                    ...(tokens?.refresh_token && {
                      refresh_token: tokens.refresh_token,
                    }),
                  },
                ])
              : await oAuth2TokenRepository.save(
                  oAuth2TokenRepository.create({
                    access_token: tokens.access_token,
                    ...(tokens?.refresh_token && {
                      refresh_token: tokens.refresh_token,
                    }),
                  }),
                );
          } catch (error) {
            console.log(chalk.white.bgRed('on tokens Error'));
            console.log(error);
            throw error;
          }
        });

        if (!exist_tokens) {
          await oAuth2Client.getToken(process.env.AUTH_CODE);
        } else {
          const token_info = await oAuth2Client
            .getTokenInfo(exist_tokens.access_token)
            .catch(async error => {
              oAuth2Client.setCredentials({
                refresh_token: exist_tokens.refresh_token,
              });
              oAuth2Client.refreshAccessToken((error, credentials) => {
                if (error) {
                  console.log(chalk.white.bgRed('refreshAccessTokenError'));
                  console.log(error);
                  throw error;
                }

                console.log(chalk.yellow('refresh_access_token'));
                oAuth2Client.setCredentials({ ...credentials });
              });
            });

          if (token_info) {
            console.log(chalk.yellow('exist_access_token'));
            oAuth2Client.setCredentials({
              refresh_token: exist_tokens.refresh_token,
              expiry_date: token_info.expiry_date,
              access_token: exist_tokens.access_token,
              token_type: 'Bearer',
              scope: 'https://mail.google.com',
            });
            console.log(parseDate(oAuth2Client.credentials.expiry_date));
          }
        }

        const gmail = google.gmail({
          version: 'v1',
          auth: oAuth2Client,
        });

        const transporter = mailer.createTransport({
          service: 'gmail',
          host: 'smtp.google.com',
          port: 587,
          secure: true,
          auth: {
            type: 'OAuth2',
            user: options.oAuthUserEmail,
            clientId: options.gmailClientID,
            clientSecret: options.gmailSecretKey,
            refreshToken: oAuth2Client.credentials.refresh_token,
          },
        });

        resolve({
          oAuth2Client,
          gmail,
          transporter,
        });
      });

    return {
      module: MailModule,
      providers: [
        MailService,
        {
          provide: CONFIG_OPTIONS,
          useValue: options,
        },
        {
          provide: MAIL_CONFIG,
          useFactory: async () => await init(options),
        },
      ],
      exports: [MailService],
    };
  }
}
