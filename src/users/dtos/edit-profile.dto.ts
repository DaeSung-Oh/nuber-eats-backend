import { Field, InputType, ObjectType, OmitType } from '@nestjs/graphql';
import { CoreError } from 'src/errors';
import { CoreOutput } from '../../common/dtos/output.dto';

@InputType()
export class EditProfileInput {
  @Field(type => String, { nullable: true })
  email?: string;
  @Field(type => String, { nullable: true })
  password?: string;
}

@ObjectType()
export class EditProfileErrors {
  @Field(type => CoreError, { nullable: true })
  email?: Error;
  @Field(type => CoreError, { nullable: true })
  password?: Error;
  @Field(type => [CoreError], { nullable: true })
  systemErrors?: CoreError[];
}

@ObjectType()
export class EditProfileOutput extends OmitType(CoreOutput, ['error']) {
  @Field(type => EditProfileErrors, { nullable: true })
  errors?: EditProfileErrors;
}
