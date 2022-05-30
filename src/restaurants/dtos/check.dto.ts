import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';

@InputType()
export class CheckInput {
  @Field(type => Number)
  restaurantId: number;
  @Field(type => Number)
  userId: number;
}

@ObjectType()
export class CheckOutput extends CoreOutput {}
