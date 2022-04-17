import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { EmailTemplate, EmailVar } from '../mail.interface';

@InputType()
export class EmailVarField {
  @Field(type => String)
  key: string;
  @Field(type => String)
  value: string;
}

@InputType()
export class SendEmailInput {
  @Field(type => String)
  to: string;
  @Field(type => String, { defaultValue: 'verifyEmail' })
  templateName: EmailTemplate;
  @Field(type => [EmailVarField])
  emailVars: EmailVar[];
}

@InputType()
export class SendVerificationEmailInput {
  @Field(type => String)
  email: string;
  @Field(type => String)
  code: string;
}

@ObjectType()
export class SendEmailOutput extends CoreOutput {}
