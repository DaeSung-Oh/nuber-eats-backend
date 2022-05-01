import { Field, ObjectType } from '@nestjs/graphql';

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
export class CoreError {
  @Field(type => BaseError, { nullable: true })
  error?: Error;
}

@ObjectType()
export class CoreOutput {
  @Field(type => String, { nullable: true })
  error?: string;

  @Field(type => Boolean)
  ok: boolean;
}
