import { gmail_v1 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

export interface MailModuleOptions {
  oAuthUserEmail: string;
  gmailClientID: string;
  gmailSecretKey: string;
}

export interface MailConfig {
  oAuth2Client: OAuth2Client;
  gmail: gmail_v1.Gmail;
  transporter: any;
}

export type EmailTemplateVarsType = WelcomeEmailVar | VerfificationEmailVar;
export interface WelcomeEmailVar {
  userEmail: string;
}
export interface VerfificationEmailVar {
  userEmail: string;
  code: string;
}

export interface MessageConfig {
  from: string;
  to: string;
  subject: string;
  html: string;
}
