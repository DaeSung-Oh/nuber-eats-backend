import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsString } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  Entity,
  getRepository,
  ManyToOne,
  OneToMany,
  RelationId,
} from 'typeorm';
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

  @ManyToOne(type => User, user => user.restaurants, { onDelete: 'CASCADE' })
  @Field(type => User)
  owner: User;

  @RelationId((restaurant: Restaurant) => restaurant.owner)
  ownerId: number;

  @OneToMany(type => Menu, menu => menu.restaurant)
  @Field(type => [Menu])
  menus: Menu[];

  @RelationId((restaurant: Restaurant) => restaurant.menus)
  menusId: number;

  static async checkNullOrOwner({
    restaurantId,
    userId,
  }: CheckRestaurantInput): Promise<boolean> {
    const restaurant = await getRepository<Restaurant>(Restaurant).findOne({
      id: restaurantId,
    });

    const restaurantIsNotNull = new Promise<boolean>(
      async (resolve, reject) => {
        if (!restaurant) {
          reject(new Error('not found restaurnat'));
        }
        resolve(true);
      },
    );

    const userIsOwnerOfRestaurant = new Promise<boolean>((resolve, reject) => {
      if (userId !== restaurant.ownerId) {
        reject(new Error('user is not owner of this restaurant'));
      }
      resolve(true);
    });

    try {
      await Promise.all([restaurantIsNotNull, userIsOwnerOfRestaurant]);
      return true;
    } catch (e) {
      throw e;
    }
  }
}
