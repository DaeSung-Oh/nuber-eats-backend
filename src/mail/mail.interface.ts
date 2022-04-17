import { gmail_v1 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

export interface MailModuleOptions {
  apiKey: string;
  oAuthUser: string;
  refreshToken: string;
  gmailClientID: string;
  gmailSecretKey: string;
}

export interface MailVars {
  transporter: any;
  oAuth2Client: OAuth2Client;
  gmail: gmail_v1.Gmail;
}

export interface EmailVar {
  key: string;
  value: string;
}

export type EmailTemplate = 'verifyEmail' | 'welcome';
