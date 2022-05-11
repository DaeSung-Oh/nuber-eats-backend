import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { User } from 'src/users/entities/user.entity';
import {
  CreateRestaurantInput,
  CreateRestaurantOutput,
} from './dtos/create-restaurant.dto';
import { Restaurant } from './entities/restaurant.entity';
import { RestaurantService } from './restaurants.service';
import {
  EditRestaurantInput,
  EditRestaurantOutput,
} from './dtos/edit-restaurant.dto';
import { Role } from 'src/auth/role.decorator';
import {
  DeleteRestaurantInput,
  DeleteRestaurantOutput,
} from './dtos/delete-restaurant.dto';
import { Category } from './entities/category.entity';
import { AllCategoriesOutput } from './dtos/category/all-categories.dto';
import { CreateCategoryOutput } from './dtos/category/create-category.dto';
import { CategoryInput, CategoryOutput } from './dtos/category/category.dto';
import { PaginationConfig } from 'src/common/dtos/pagination.dto';
import { AllRestaurantsOutput } from './dtos/all-restaurants.dto';
import { RestaurantInput, RestaurantOutput } from './dtos/restaurant.dto';
import {
  SearchRestaurantInput,
  SearchRestaurantOutput,
} from './dtos/search-restaurant.dto';
import { Menu } from './entities/menu.entity';
import { CreateMenuInput, CreateMenuOutput } from './dtos/menu/create-menu.dto';
import { DeleteMenuInput, DeleteMenuOutput } from './dtos/menu/delete-menu.dto';
import { EditMenuInput, EditMenuOutput } from './dtos/menu/edit-menu.dto';

@Resolver(of => Restaurant)
export class RestaurantResolver {
  constructor(private readonly restaurantsService: RestaurantService) {}

  @Mutation(returns => CreateRestaurantOutput)
  @Role(['Owner'])
  createRestaurant(
    @AuthUser() authUser: User,
    @Args('input') createRestaurantInput: CreateRestaurantInput,
  ): Promise<CreateRestaurantOutput> {
    return this.restaurantsService.createRestaurant(
      authUser,
      createRestaurantInput,
    );
  }

  @Mutation(returns => EditRestaurantOutput)
  @Role(['Owner'])
  editRestaurant(
    @AuthUser() owner: User,
    @Args('input') editRestaurantInput: EditRestaurantInput,
  ): Promise<EditRestaurantOutput> {
    return this.restaurantsService.editRestaurant(owner, editRestaurantInput);
  }

  @Mutation(returns => DeleteRestaurantOutput)
  @Role(['Owner'])
  deleteRestaurant(
    @AuthUser() owner: User,
    @Args('input') deleteRestaurantInput: DeleteRestaurantInput,
  ): Promise<DeleteRestaurantOutput> {
    return this.restaurantsService.deleteRestaurant(
      owner,
      deleteRestaurantInput,
    );
  }

  @Query(returns => RestaurantOutput)
  restaurant(
    @Args() restaurantInput: RestaurantInput,
  ): Promise<RestaurantOutput> {
    return this.restaurantsService.findRestaurantById(restaurantInput);
  }

  @Query(returns => AllRestaurantsOutput)
  allRestaurants(
    @Args('pagination') paginationConfig: PaginationConfig,
  ): Promise<AllRestaurantsOutput> {
    return this.restaurantsService.findAllRestaurants(paginationConfig);
  }

  @Query(returns => SearchRestaurantOutput)
  searchRestaurant(
    @Args('searchParams') searchRestaurantInput: SearchRestaurantInput,
    @Args('pagination') paginationConfig: PaginationConfig,
  ): Promise<SearchRestaurantOutput> {
    return this.restaurantsService.searchRestaurant(
      searchRestaurantInput,
      paginationConfig,
    );
  }
}

@Resolver(of => Category)
export class CategoryResolver {
  constructor(private readonly restaurantsService: RestaurantService) {}

  @ResolveField(type => Number)
  restaurantCount(@Parent() category: Category): Promise<number> {
    return this.restaurantsService.countRestaurants(category);
  }

  // once , create categories for to force user select category(not create category by user)
  @Mutation(returns => CreateCategoryOutput)
  createInitialCategory(): Promise<CreateCategoryOutput> {
    return this.restaurantsService.createInitialCategory();
  }

  @Query(returns => CategoryOutput)
  category(
    @Args() categoryInput: CategoryInput,
    @Args('pagination') paginationConfig: PaginationConfig,
  ): Promise<CategoryOutput> {
    return this.restaurantsService.findCategoryByName(
      categoryInput,
      paginationConfig,
    );
  }

  @Query(returns => AllCategoriesOutput)
  allCategories(
    @Args('pagination') paginationConfig: PaginationConfig,
  ): Promise<AllCategoriesOutput> {
    return this.restaurantsService.findAllCategories(paginationConfig);
  }
}

@Resolver(of => Menu)
export class MenuResolver {
  constructor(private readonly restaurantsService: RestaurantService) {}

  @Mutation(returns => CreateMenuOutput)
  @Role(['Owner'])
  createMenu(
    @AuthUser() owner: User,
    @Args('input') createMenuInput: CreateMenuInput,
  ): Promise<CreateMenuOutput> {
    return this.restaurantsService.createMenu(owner, createMenuInput);
  }

  @Mutation(returns => EditMenuOutput)
  @Role(['Owner'])
  editMenu(
    @AuthUser() owner: User,
    @Args('input') editMenuInput: EditMenuInput,
  ): Promise<EditMenuOutput> {
    return this.restaurantsService.editMenu(owner, editMenuInput);
  }

  @Mutation(returns => DeleteMenuOutput)
  @Role(['Owner'])
  deleteMenu(
    @AuthUser() owner: User,
    @Args('input') deleteMenuInput: DeleteMenuInput,
  ): Promise<DeleteMenuOutput> {
    return this.restaurantsService.deleteMenu(owner, deleteMenuInput);
  }
}
