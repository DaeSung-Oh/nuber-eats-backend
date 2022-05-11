import {
  Field,
  InputType,
  ObjectType,
  OmitType,
  PartialType,
} from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { CreateMenuInput } from './create-menu.dto';

@InputType()
export class EditMenuInput extends PartialType(
  OmitType(CreateMenuInput, ['restaurantId']),
) {
  @Field(type => Number)
  menuId: number;
}

@ObjectType()
export class EditMenuOutput extends CoreOutput {}
