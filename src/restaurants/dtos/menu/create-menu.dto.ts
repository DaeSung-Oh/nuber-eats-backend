import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Menu } from 'src/restaurants/entities/menu.entity';

@InputType()
export class CreateMenuInput extends PickType(Menu, [
  'name',
  'price',
  'description',
  'options',
]) {
  @Field(type => String, { nullable: true })
  photo?: string;

  @Field(type => Number)
  restaurantId: number;
}

@ObjectType()
export class CreateMenuOutput extends CoreOutput {}
