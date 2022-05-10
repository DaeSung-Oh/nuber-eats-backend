import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { PaginationOutput } from 'src/common/dtos/pagination.dto';
import { Restaurant } from '../entities/restaurant.entity';

@InputType()
export class SearchRestaurantInput {
  @Field(type => String, { nullable: true })
  query?: string;
}

@ObjectType()
export class SearchRestaurantOutput extends PaginationOutput {
  @Field(type => [Restaurant], { nullable: true })
  restaurants?: Restaurant[];
}
