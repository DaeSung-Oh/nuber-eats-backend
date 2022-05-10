import { Categories, Category } from 'src/restaurants/entities/category.entity';
import { Connection } from 'typeorm';
import { Factory, Seeder } from 'typeorm-seeding';

export class CreateCategory implements Seeder {
  /* 
    id   |  createdAt  |  updatedAt  | name | coverImage |  restaurnats     
  */
  public async run(factory: Factory, connection: Connection): Promise<any> {
    const categoryCoverImage = {
      KoreanFood: 'koreanFoodUrl',
      SchoolFood: 'SchoolFoodUrl',
      JapaneseFood: 'JapaneseFoodUrl',
      ChineseFood: 'ChineseFoodUrl',
      CafeAndDesert: 'CafeAndDesertUrl',
      Chicken: 'ChickenUrl',
      FastFood: 'FastFoodUrl',
    };

    Array.from(Object.entries(Categories)).forEach(
      async ([key, name], index) => {
        await factory(Category)({
          name,
          coverImage: categoryCoverImage[key],
        }).create();
      },
    );
  }
}
