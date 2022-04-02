import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { CreateRestaurantDto } from './dtos/create-restaurant.dto';
import { Restaurant } from './entities/restaurant.entity';

@Resolver(of => Restaurant)
export class RestaurantsResolver {
  @Query(returns => [Restaurant])
  restaurants(): Restaurant[] {
    return [];
  }

  @Mutation(returns => Boolean)
  createRestaurant(@Args() createRestaurantDto: CreateRestaurantDto): boolean {
    return true;
  }
}
