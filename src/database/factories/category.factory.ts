import { Categories, Category } from 'src/restaurants/entities/category.entity';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { define } from 'typeorm-seeding';

const initData = {};

define(Category, (initData, { name, coverImage }: Category) => {
  const category = new Category();
  category.name = name;
  category.coverImage = coverImage;
  category.restaurants = [] as Restaurant[];
  return category;
});
