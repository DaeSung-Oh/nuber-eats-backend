import { Field, InputType } from '@nestjs/graphql';
import { EmailTemplate } from '../mail.interface';

@InputType()
export class SendEmailInput {
  @Field(type => String)
  to: string;
  @Field(type => String, { defaultValue: 'verifyEmail' })
  templateName: EmailTemplate;
}
