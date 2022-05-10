import {
  Field,
  InputType,
  ObjectType,
  OmitType,
  PartialType,
  PickType,
} from '@nestjs/graphql';
import { BaseError, CoreOutput } from '../../common/dtos/output.dto';
import { User } from '../entities/user.entity';
import { IEditProfileErrors } from '../profile.interface';

@InputType()
export class EditProfileInput extends PartialType(
  PickType(User, ['email', 'password']),
) {}

// @ObjectType()
// export class EditProfileErrors extends BaseEditErrors<EditProfileInput> {
//   // @Field(type => BaseError, { nullable: true })
//   // email?: Error;
//   // @Field(type => BaseError, { nullable: true })
//   // password?: Error;
// }

@ObjectType()
export class EditProfileErrors {
  @Field(type => BaseError, { nullable: true })
  email?: Error;

  @Field(type => BaseError, { nullable: true })
  password?: Error;

  @Field(type => BaseError, { nullable: true })
  error?: Error;
}

@ObjectType()
export class EditProfileOutput extends OmitType(CoreOutput, ['error']) {
  @Field(type => EditProfileErrors, { nullable: true })
  errors?: IEditProfileErrors;
}
