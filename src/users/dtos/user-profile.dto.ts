import { ArgsType, Field, ObjectType, OmitType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { CoreError } from 'src/errors';
import { User } from '../entities/user.entity';

@ArgsType()
export class UserProfileInput {
  @Field(type => Number)
  userId: number;
}

@ObjectType()
export class UserProfileOutput extends OmitType(CoreOutput, ['error']) {
  @Field(type => CoreError, { nullable: true })
  error?: CoreError;
  @Field(type => User, { nullable: true })
  user?: User;
}
