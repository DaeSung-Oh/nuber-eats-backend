import {
  Field,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { IsEnum, IsNumber } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import {
  Client,
  DeliveryMan,
  User,
  UserRole,
} from 'src/users/entities/user.entity';
import { Column, Entity, JoinTable, ManyToMany, ManyToOne } from 'typeorm';
import { OrderMenu } from './orderMenu.entity';

export enum OrderStatus {
  Pending = 'Pending',
  Cooking = 'Cooking',
  Cooked = 'Cooked',
  PickedUp = 'PickedUp',
  Delivered = 'Delivered',
  Rejected = 'Rejected',
}

export enum CategoryReasonRejected {
  ClientRequest = 'ClientRequest',
  Restaurant = 'Restaurant',
  Other = 'OtherReason',
}

registerEnumType(OrderStatus, { name: 'OrderStatus' });
registerEnumType(CategoryReasonRejected, { name: 'CategoryReasonRejected' });

@InputType('ReasonRejectedInputType', { isAbstract: true })
@ObjectType()
export class ReasonRejected {
  @Field(type => CategoryReasonRejected)
  reason: CategoryReasonRejected;
  @Field(type => String, { nullable: true })
  detail?: string;
}

@InputType('OrderInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Order extends CoreEntity {
  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.Pending })
  @Field(type => OrderStatus, { defaultValue: OrderStatus.Pending })
  @IsEnum(OrderStatus)
  orderStatus: OrderStatus;

  @Column({ type: 'json', nullable: true })
  @Field(type => ReasonRejected, { nullable: true })
  reasonRejected?: ReasonRejected;

  @Column()
  @Field(type => Number)
  @IsNumber()
  totalPrice: number;

  // relations
  @ManyToOne(type => Client, client => client.orders, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @Field(type => User, { nullable: true })
  customer?: User;

  @ManyToOne(type => DeliveryMan, deliveryMan => deliveryMan.deliveryOrders, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @Field(type => DeliveryMan, { nullable: true })
  driver?: DeliveryMan;

  @ManyToOne(type => Restaurant, restaurant => restaurant.orders, {
    onDelete: 'CASCADE',
  })
  @Field(type => Restaurant)
  restaurant: Restaurant;

  @ManyToMany(type => OrderMenu)
  @Field(type => [OrderMenu])
  @JoinTable()
  orderMenuList: OrderMenu[];
}
