import { Field, ObjectType } from '@nestjs/graphql';
import { PaginationOutput } from 'src/common/dtos/pagination.dto';
import { Restaurant } from '../entities/restaurant.entity';

@ObjectType()
export class AllRestaurantsOutput extends PaginationOutput {
  @Field(type => [Restaurant], { nullable: true })
  restaurants?: Restaurant[];
}
