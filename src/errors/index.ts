import { Field, ObjectType } from '@nestjs/graphql';

// export type ErrorFields<T> = { [P in keyof T]?: Error };

@ObjectType()
export class CoreError {
  constructor(message?: string) {
    this.name = 'Error';
    this.message = message ?? '';
    this.stack = new Error().stack;
  }

  @Field(type => String, { nullable: true })
  type?: string;
  @Field(type => String)
  name: string;
  @Field(type => String)
  message: string;
  @Field(type => String, { nullable: true })
  stack?: string;
}
