import {
  Field,
  InputType,
  ObjectType,
  OmitType,
  registerEnumType,
} from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { CoreError } from 'src/errors';

export enum EmailTemplateName {
  WelcomeEmail = 'welcomeEmail',
  VerificationEmail = 'verificationEmail',
}

registerEnumType(EmailTemplateName, { name: 'EmailTemplateName' });

@InputType()
@ObjectType()
export class EmailVarFields {
  @Field(type => String)
  userEmail: string;
  @Field(type => String, { nullable: true })
  code?: string;
}

@InputType()
export class SendEmailInput {
  @Field(type => String)
  to: string;
  @Field(type => EmailTemplateName, {
    defaultValue: EmailTemplateName.VerificationEmail,
  })
  templateName: EmailTemplateName;
  @Field(type => EmailVarFields)
  emailVars: EmailVarFields;
}

@InputType()
export class SendVerificationEmailInput {
  @Field(type => String)
  email: string;
  @Field(type => String)
  code: string;
}

@ObjectType()
export class SendEmailOutput extends OmitType(CoreOutput, ['error']) {
  @Field(type => CoreError, { nullable: true })
  error?: CoreError;

  @Field(type => String, { nullable: true })
  res_string?: string;
}
