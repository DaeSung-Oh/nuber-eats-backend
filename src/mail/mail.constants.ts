export const MAIL_CONFIG = 'MAIL_CONFIG';
export const SCOPES = ['https://mail.google.com/'];
export const WELCOME_EMAIL_SUBJECT = (userEmail: string) =>
  `${userEmail} 님의 가입을 환영합니다`;
export const VERIFICATION_EMAIL_SUBJECT = (userEmail: string) =>
  `${userEmail}님의 인증메일 입니다`;
