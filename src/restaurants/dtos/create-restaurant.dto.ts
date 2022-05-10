import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Categories, Category } from '../entities/category.entity';
import { Restaurant } from '../entities/restaurant.entity';

@InputType()
export class CreateRestaurantInput extends PickType(Restaurant, [
  'name',
  'address',
  'coverImage',
]) {
  @Field(type => Categories)
  categoryName: Categories;
}

@ObjectType()
export class CreateRestaurantOutput extends CoreOutput {}
