import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Raw, Repository } from 'typeorm';
import {
  CreateRestaurantInput,
  CreateRestaurantOutput,
} from './dtos/create-restaurant.dto';
import { CreateCategoryOutput } from './dtos/category/create-category.dto';
import { Categories, Category } from './entities/category.entity';
import { Restaurant } from './entities/restaurant.entity';
import {
  EditRestaurantInput,
  EditRestaurantOutput,
} from './dtos/edit-restaurant.dto';
import {
  DeleteRestaurantInput,
  DeleteRestaurantOutput,
} from './dtos/delete-restaurant.dto';
import { AllCategoriesOutput } from './dtos/category/all-categories.dto';
import { CategoryInput, CategoryOutput } from './dtos/category/category.dto';
import { PaginationConfig } from 'src/common/dtos/pagination.dto';
import { AllRestaurantsOutput } from './dtos/all-restaurants.dto';
import { RestaurantInput, RestaurantOutput } from './dtos/restaurant.dto';
import {
  SearchRestaurantInput,
  SearchRestaurantOutput,
} from './dtos/search-restaurant.dto';

@Injectable()
export class RestaurantService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
    @InjectRepository(Category)
    private readonly categories: Repository<Category>,
  ) {}

  // category
  async createInitialCategory(): Promise<CreateCategoryOutput> {
    try {
      await this.categories.query(
        `TRUNCATE category RESTART IDENTITY CASCADE;`,
      );

      const categoryCoverImage = {
        KoreanFood: 'https://koreanFoodUrl',
        SchoolFood: 'https://SchoolFoodUrl',
        JapaneseFood: 'https://JapaneseFoodUrl',
        ChineseFood: 'https://ChineseFoodUrl',
        CafeAndDesert: 'https://CafeAndDesertUrl',
        Chicken: 'https://ChickenUrl',
        FastFood: 'https://FastFoodUrl',
      };

      Object.entries(Categories).forEach(async ([key, name]) => {
        await this.categories.save(
          this.categories.create({
            name,
            coverImage: categoryCoverImage[key],
          }),
        );
      });

      return { ok: true };
    } catch (e) {
      return { ok: false, error: 'Could not create Category' };
    }
  }

  async countRestaurants(category: Category): Promise<number> {
    return this.restaurants.count({ category });
  }

  async findCategoryByName(
    { categoryName }: CategoryInput,
    { page, numberOfPerPage }: PaginationConfig,
  ): Promise<CategoryOutput> {
    try {
      const category = await this.categories.findOne({ name: categoryName });

      if (!category) return { ok: false, error: 'not found category' };

      const [restaurants, totalItems] = await this.restaurants.findAndCount({
        where: { category },
        take: numberOfPerPage,
        skip: (page - 1) * numberOfPerPage,
      });

      const totalPage = Math.ceil(totalItems / numberOfPerPage);

      return { ok: true, category, restaurants, totalPage, totalItems };
    } catch (error) {
      return { ok: false, error: error?.message ?? 'not found category' };
    }
  }

  async findAllCategories({
    page,
    numberOfPerPage,
  }: PaginationConfig): Promise<AllCategoriesOutput> {
    try {
      const [categories, totalItems] = await this.categories.findAndCount({
        take: numberOfPerPage,
        skip: (page - 1) * numberOfPerPage,
      });

      const totalPage = Math.ceil(totalItems / numberOfPerPage);

      return { ok: true, categories, totalPage, totalItems };
    } catch (error) {
      return { ok: false, error: error?.message ?? 'not found categories' };
    }
  }

  // restaurant
  async createRestaurant(
    owner: User,
    createRestaurantInput: CreateRestaurantInput,
  ): Promise<CreateRestaurantOutput> {
    try {
      const { name, address, coverImage, categoryName } = createRestaurantInput;

      const category = await this.categories.findOne({ name: categoryName });
      await this.restaurants.save(
        this.restaurants.create({
          name,
          address,
          coverImage,
          category,
          owner,
        }),
      );

      return { ok: true };
    } catch (e) {
      console.log('[restaurantService Error] ', e);
      return { ok: false, error: 'Colud not create restaurant' };
    }
  }

  async findRestaurantById({
    restaurantId,
  }: RestaurantInput): Promise<RestaurantOutput> {
    try {
      const restaurant = await this.restaurants.findOne(
        { id: restaurantId },
        { relations: ['category'] },
      );

      if (!restaurant) {
        return {
          ok: false,
          error: 'Could not find restaurant',
        };
      }

      return { ok: true, restaurant };
    } catch (error) {
      return {
        ok: false,
        error: error?.message ?? 'Could not find restaurant',
      };
    }
  }

  async findAllRestaurants({
    page,
    numberOfPerPage,
  }: PaginationConfig): Promise<AllRestaurantsOutput> {
    try {
      const [restaurants, totalItems] = await this.restaurants.findAndCount({
        take: numberOfPerPage,
        skip: (page - 1) * numberOfPerPage,
        relations: ['category'],
      });

      const totalPage = Math.ceil(totalItems / numberOfPerPage);

      return { ok: true, restaurants, totalPage, totalItems };
    } catch (error) {
      return { ok: false, error: error?.message ?? 'not found restaurants' };
    }
  }

  async searchRestaurant(
    { query }: SearchRestaurantInput,
    { page, numberOfPerPage }: PaginationConfig,
  ): Promise<SearchRestaurantOutput> {
    try {
      const [restaurants, totalItems] = await this.restaurants.findAndCount({
        where: {
          name: Raw(name => `${name} ILIKE '%${query}%'`),
        },
        take: numberOfPerPage,
        skip: (page - 1) * numberOfPerPage,
        relations: ['category'],
      });

      const totalPage = Math.ceil(totalItems / numberOfPerPage);

      return { ok: true, restaurants, totalPage, totalItems };
    } catch (error) {
      return {
        ok: false,
        error: error?.message ?? 'Could not search restaurant',
      };
    }
  }

  async editRestaurant(
    owner: User,
    editRestaurantInput: EditRestaurantInput,
  ): Promise<EditRestaurantOutput> {
    try {
      const { restaurantId, categoryName } = editRestaurantInput;

      // check restaurant is null or user is owner of restaurant
      await Restaurant.checkNullOrOwner({
        restaurantId,
        userId: owner.id,
      });

      const category =
        categoryName && (await this.categories.findOne({ name: categoryName }));

      await this.restaurants.save([
        {
          id: restaurantId,
          ...editRestaurantInput,
          ...(category && { category }),
        },
      ]);

      return { ok: true };
    } catch (error) {
      return { ok: false, error: error.message ?? 'Could not edit restaurant' };
    }
  }

  async deleteRestaurant(
    owner: User,
    { restaurantId }: DeleteRestaurantInput,
  ): Promise<DeleteRestaurantOutput> {
    try {
      // check restaurant is null or user is owner of restaurant
      await Restaurant.checkNullOrOwner({ restaurantId, userId: owner.id });

      await this.restaurants.delete({ id: restaurantId });

      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: error?.message ?? 'Could not delete restaurant',
      };
    }
  }
}
