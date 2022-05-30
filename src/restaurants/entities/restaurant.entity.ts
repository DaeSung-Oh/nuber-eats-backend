import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsString } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { RestaurantNotFoundError } from 'src/errors/NotFoundErrors';
import { Order } from 'src/orders/entities/order.entity';
import { Owner, User, UserRole } from 'src/users/entities/user.entity';
import {
  Column,
  Entity,
  getRepository,
  ManyToOne,
  OneToMany,
  RelationId,
} from 'typeorm';
import { NotPermissionToRestaurantError } from '../../errors/NotPermissionToRestaurantError';
import { CheckRestaurantInput } from '../restaurants.interface';
import { Category } from './category.entity';
import { Menu } from './menu.entity';

@InputType('RestaurantInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Restaurant extends CoreEntity {
  @Column()
  @Field(type => String)
  @IsString()
  name: string;

  @Column()
  @Field(type => String)
  @IsString()
  address: string;

  @Column()
  @Field(type => String)
  @IsString()
  coverImage: string;

  @ManyToOne(type => Category, category => category.restaurants, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @Field(type => Category, { nullable: true })
  category?: Category;
  @RelationId((restaurant: Restaurant) => restaurant?.category)
  categoryId?: number;

  @ManyToOne(type => Owner, owner => owner.restaurants, { onDelete: 'CASCADE' })
  @Field(type => Owner)
  owner: Owner;
  @RelationId((restaurant: Restaurant) => restaurant.owner)
  ownerId: number;

  @OneToMany(type => Menu, menu => menu.restaurant)
  @Field(type => [Menu])
  menus: Menu[];
  @RelationId((restaurant: Restaurant) => restaurant.menus)
  menusId: number;

  @OneToMany(type => Order, order => order.restaurant)
  @Field(type => [Order])
  orders: Order[];

  static async checkNullAndIsOwner({
    restaurantId,
    userId,
  }: CheckRestaurantInput): Promise<Restaurant> {
    const restaurant = await getRepository<Restaurant>(Restaurant).findOne({
      id: restaurantId,
    });

    const restaurantIsNotNull = new Promise<Restaurant>(
      async (resolve, reject) => {
        if (!restaurant) {
          reject(new RestaurantNotFoundError());
        }
        resolve(restaurant);
      },
    );

    const userIsOwnerOfRestaurant = new Promise<boolean>((resolve, reject) => {
      if (userId !== restaurant.ownerId) {
        reject(new NotPermissionToRestaurantError());
      }
      resolve(true);
    });

    try {
      return await Promise.all([
        restaurantIsNotNull,
        userIsOwnerOfRestaurant,
      ])[0];
    } catch (e) {
      throw e;
    }
  }
}
