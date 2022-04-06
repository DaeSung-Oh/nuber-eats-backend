import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class MutationOutput {
  @Field(type => String, { nullable: true })
  error?: string;

  @Field(type => String)
  ok: boolean;
}
