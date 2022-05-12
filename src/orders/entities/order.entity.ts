import {
  Field,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { IsEnum, IsNumber } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Menu } from 'src/restaurants/entities/menu.entity';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, JoinTable, ManyToMany, ManyToOne } from 'typeorm';

export enum OrderStatus {
  Pending = 'Pending',
  Cooking = 'Cooking',
  PickedUp = 'PickedUp',
  Delivered = 'Delivered',
  Rejected = 'Rejected',
}
registerEnumType(OrderStatus, { name: 'OrderStatus' });

@InputType('OrderInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Order extends CoreEntity {
  @Column({ type: 'enum', enum: OrderStatus })
  @Field(type => OrderStatus, { defaultValue: OrderStatus.Pending })
  @IsEnum(OrderStatus)
  orderStatus: OrderStatus;

  @Column()
  @Field(type => Number)
  @IsNumber()
  totalPrice: number;

  // relations
  @ManyToOne(type => User, user => user.orders, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @Field(type => User, { nullable: true })
  customer?: User;

  @ManyToOne(type => User, user => user.deliveryList, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @Field(type => User, { nullable: true })
  driver?: User;

  @ManyToOne(type => Restaurant, restaurant => restaurant.orders, {
    onDelete: 'CASCADE',
  })
  @Field(type => Restaurant)
  restaurant: Restaurant;

  @ManyToMany(type => Menu)
  @Field(type => [Menu])
  @JoinTable()
  menuList: Menu[];
}
