import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Menu } from 'src/restaurants/entities/menu.entity';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { MenuRepository } from 'src/restaurants/repositories/menuRepository';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderResolver } from './orders.resolver';
import { OrderService } from './orders.service';
import { OrderMenuRepository } from './repositories/orderMenuRepository';

const orderByorderStatus = [
  OrderStatus.Pending,
  OrderStatus.Cooking,
  OrderStatus.Cooked,
  OrderStatus.PickedUp,
  OrderStatus.Delivered,
  OrderStatus.Rejected,
];

export interface AllowedOrderStatus {
  ownerAllowedStatus: OrderStatus[];
  deliveryAllowedStatus: OrderStatus[];
}

const allowedOrderStatus = {
  ownerAllowedStatus: [
    OrderStatus.Pending,
    OrderStatus.Rejected,
    OrderStatus.Cooking,
    OrderStatus.PickedUp,
  ],
  deliveryAllowedStatus: [OrderStatus.PickedUp, OrderStatus.Delivered],
};

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      Menu,
      MenuRepository,
      OrderMenuRepository,
      Restaurant,
    ]),
  ],
  providers: [
    OrderResolver,
    OrderService,
    {
      provide: 'AllowedOrderStatus',
      useValue: allowedOrderStatus,
    },
    {
      provide: 'OrderByOrderStatus',
      useValue: orderByorderStatus,
    },
  ],
})
export class OrdersModule {}
