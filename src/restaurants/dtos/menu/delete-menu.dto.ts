import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';

@InputType()
export class DeleteMenuInput {
  @Field(type => Number)
  menuId: number;
}

@ObjectType()
export class DeleteMenuOutput extends CoreOutput {}
