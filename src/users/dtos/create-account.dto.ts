import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { CoreError } from 'src/errors';
import { User } from '../entities/user.entity';
import { EditProfileOutput } from './edit-profile.dto';

@ObjectType()
export class CreateAccountErrors {
  @Field(type => CoreError, { nullable: true })
  email?: CoreError;
  @Field(type => CoreError, { nullable: true })
  password?: CoreError;
  @Field(type => CoreError, { nullable: true })
  role?: CoreError;
  @Field(type => [CoreError], { nullable: true })
  systemErrors?: CoreError[];
}

@InputType()
export class CreateAccountInput extends PickType(User, [
  'email',
  'password',
  'role',
]) {}

@ObjectType()
export class CreateAccountOutput extends PickType(CoreOutput, ['ok']) {
  /*
    ok
    errors : {
      email,
      password,
      role,
      systemErrors: [
        coreError
      ]
    }
  */
  @Field(type => CreateAccountErrors, { nullable: true })
  errors?: CreateAccountErrors;
}
