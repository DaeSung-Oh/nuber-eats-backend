import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Menu } from './entities/menu.entity';
import { Restaurant } from './entities/restaurant.entity';
import {
  CategoryResolver,
  MenuResolver,
  RestaurantResolver,
} from './restaurants.resolver';
import { RestaurantService } from './restaurants.service';

@Module({
  imports: [TypeOrmModule.forFeature([Restaurant, Category, Menu])],
  providers: [
    RestaurantResolver,
    CategoryResolver,
    MenuResolver,
    RestaurantService,
  ],
  exports: [RestaurantService],
})
export class RestaurantsModule {}
