import { RestaurantNotFoundError } from 'src/errors/NotFoundErrors';
import { EntityRepository, Repository } from 'typeorm';
import { Restaurant } from '../entities/restaurant.entity';
import { CheckRestaurantInput } from '../restaurants.interface';

@EntityRepository(Restaurant)
export class RestaurantRepository extends Repository<Restaurant> {
  async findById(id: number) {
    try {
      const restaurant = await this.createQueryBuilder('restaurant')
        .where('restaurant.id = :id', { id })
        .getOne();
      return restaurant;
    } catch (error) {
      throw error;
    }
  }

  async checkNullAndIsOwner({ restaurantId, userId }: CheckRestaurantInput) {
    try {
      const restaurant = await this.createQueryBuilder('restaurant')
        .where('restaurant.id = :restaurantId', { restaurantId })
        .andWhere('restaurant.ownerId = :userId', { userId })
        .getOne();
      if (!restaurant) throw new RestaurantNotFoundError();
      return restaurant;
    } catch (error) {
      throw error;
    }
  }
}
