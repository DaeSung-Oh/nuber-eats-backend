import { ArgsType, Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { PaginationOutput } from 'src/common/dtos/pagination.dto';
import { Categories, Category } from 'src/restaurants/entities/category.entity';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';

@ArgsType()
export class CategoryInput {
  @Field(type => Categories)
  categoryName: Categories;
}

@ObjectType()
export class CategoryOutput extends PaginationOutput {
  @Field(type => Category, { nullable: true })
  category?: Category;

  @Field(type => [Restaurant], { nullable: true })
  restaurants?: Restaurant[];
}
