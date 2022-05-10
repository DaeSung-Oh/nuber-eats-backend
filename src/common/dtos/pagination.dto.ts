import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from './output.dto';

@InputType()
export class PaginationConfig {
  @Field(type => Number, { defaultValue: 1 })
  page: number;
  @Field(type => Number, { defaultValue: 10 })
  numberOfPerPage: number;
}

@ObjectType()
export class PaginationOutput extends CoreOutput {
  @Field(type => Number, { nullable: true })
  totalPage?: number;

  @Field(type => Number, { nullable: true })
  totalItems?: number;
}
