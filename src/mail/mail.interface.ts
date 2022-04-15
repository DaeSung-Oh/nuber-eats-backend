export interface MailModuleOptions {
  apiKey: string;
  oauthUser: string;
  refreshToken: string;
  gmailClientID: string;
  gmailSecretKey: string;
}

export type EmailTemplate = 'verifyEmail' | 'welcome';
