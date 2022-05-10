import { Field, ObjectType } from '@nestjs/graphql';
import { User } from 'src/users/entities/user.entity';
import { BaseEditErrorsType } from '../core.interface';

@ObjectType()
export class BaseError extends Error {
  @Field(type => String)
  name: string;

  @Field(type => String)
  message: string;

  @Field(type => String, { nullable: true })
  stack?: string;
}

@ObjectType()
export class CoreOutput {
  @Field(type => String, { nullable: true })
  error?: string;

  @Field(type => Boolean)
  ok: boolean;
}

// @ObjectType()
// export class BaseEditError<T, E = BaseError> {}

// @ObjectType()
// export class BaseEditErrorsOutput<T = User, E = BaseError> {
//   @Field(type => Boolean)
//   ok: boolean;
//   errors?: BaseEditErrorsType<T, E>;
// }
