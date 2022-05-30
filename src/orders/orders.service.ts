import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginationConfig } from 'src/common/dtos/pagination.dto';
import { RestaurantNotFoundError } from 'src/errors/NotFoundErrors';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { MenuRepository } from 'src/restaurants/repositories/menuRepository';
import { User, UserRole } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { CancelOrderInput, CancelOrderOutput } from './dtos/cancel-order.dto';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { DeleteOrderInput, DeleteOrderOutput } from './dtos/delete-order.dto';
import { EditOrderInput, EditOrderOutput } from './dtos/edit-order.dto';
import { GetOrderInput, GetOrderOutput } from './dtos/get-order.dto';
import { GetOrdersInput, GetOrdersOutput } from './dtos/get-orders.dto';
import {
  PickedUpOrderInput,
  PickedUpOrderOutput,
} from './dtos/pickedUpOrder.dto';
import {
  CategoryReasonRejected,
  Order,
  OrderStatus,
} from './entities/order.entity';
import { OrderMenu } from './entities/orderMenu.entity';
import { AllowedOrderStatus } from './orders.module';
import { OrderMenuRepository } from './repositories/orderMenuRepository';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orders: Repository<Order>,
    @InjectRepository(MenuRepository)
    private readonly menuRepository: MenuRepository,
    @InjectRepository(OrderMenuRepository)
    private readonly orderMenuRepository: OrderMenuRepository,
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
    @Inject('AllowedOrderStatus')
    private readonly allowedOrderStatus: AllowedOrderStatus,
    @Inject('OrderByOrderStatus')
    private readonly orderByOrderStatus: OrderStatus[],
  ) {}

  // Create
  async createOrder(
    customer: User,
    { restaurantId, orderMenuList }: CreateOrderInput,
  ): Promise<CreateOrderOutput> {
    try {
      const restaurant = await this.restaurants.findOne({ id: restaurantId });
      if (!restaurant) {
        throw new RestaurantNotFoundError();
      }

      let totalPrice = 0;
      let savedOrderMenuList: OrderMenu[] = [];
      for (const orderMenu of orderMenuList) {
        const { menuPrice, extraPrice, createdOrderMenu } =
          await this.menuRepository.calcMenuPriceAndCreate({
            ...orderMenu,
            ...(!orderMenu.quantity && { quantity: 1 }),
          });

        totalPrice = totalPrice + menuPrice + extraPrice;
        const savedOrderMenu = await this.orderMenuRepository.save(
          createdOrderMenu,
        );
        savedOrderMenuList = [...savedOrderMenuList, savedOrderMenu];
      }

      const orderResult = await this.orders.save(
        this.orders.create({
          customer,
          restaurant,
          totalPrice,
          orderMenuList: savedOrderMenuList,
        }),
      );

      return { ok: true };
    } catch (error) {
      return { ok: false, error: error?.message };
    }
  }

  // Read
  async getOrder(
    user: User,
    { orderId }: GetOrderInput,
  ): Promise<GetOrderOutput> {
    const whereUser = {
      Client: {
        customer: { id: user.id },
      },
      Owner: {
        restaurant: {
          ownerId: user.id,
        },
      },
      Delivery: {
        driver: { id: user.id },
      },
    };

    try {
      const order = await this.orders.findOne(
        {
          id: orderId,
          ...whereUser[user.role],
        },
        {
          relations: [
            'customer',
            'restaurant',
            'driver',
            'orderMenuList',
            'orderMenuList.menu',
          ],
        },
      );

      if (!order) throw new Error('Could not found order');

      return { ok: true, order: order };
    } catch (error) {
      return { ok: false, error: error?.message };
    }
  }

  async getOrders(
    user: User,
    { filter }: GetOrdersInput,
    { page, numberOfPerPage }: PaginationConfig,
  ): Promise<GetOrdersOutput> {
    const whereUser = {
      Client: {
        customer: { id: user.id },
      },
      Owner: {
        restaurant: {
          ownerId: user.id,
        },
      },
      Delivery: {
        driver: { id: user.id },
      },
    };

    try {
      /*
      const [orders, totalItems] =
        filter && filter.orderStatus
          ? await this.orders
              .createQueryBuilder('order')
              .leftJoinAndMapMany(
                'order.orderMenuList',
                'order.orderMenuList',
                'orderMenuList',
              )
              .leftJoinAndMapOne(
                'orderMenuList.menu',
                'orderMenuList.menu',
                'menu',
              )
              .where(whereUserId[user.role], { userId: user.id })
              .andWhere('order.orderStatus = :orderStatus', {
                orderStatus: filter.orderStatus,
              })
              .take(numberOfPerPage)
              .skip((page - 1) * numberOfPerPage)
              .getManyAndCount()
          : await this.orders
              .createQueryBuilder('order')
              .leftJoinAndMapMany(
                'order.orderMenuList',
                'order.orderMenuList',
                'orderMenuList',
              )
              .leftJoinAndMapOne(
                'orderMenuList.menu',
                'orderMenuList.menu',
                'menu',
              )
              .where(whereUserId[user.role], { userId: user.id })
              .take(numberOfPerPage)
              .skip((page - 1) * numberOfPerPage)
              .getManyAndCount();
      */
      const [orders, totalItems] = await this.orders.findAndCount({
        where: {
          ...whereUser[user.role],
          ...(filter && { ...filter }),
        },
        relations: [
          'customer',
          'restaurant',
          'driver',
          'orderMenuList',
          'orderMenuList.menu',
        ],
        take: numberOfPerPage,
        skip: (page - 1) * numberOfPerPage,
      });

      if (!orders) throw new Error('Could not found orders');

      const totalPage = Math.ceil(totalItems / numberOfPerPage);

      return { ok: true, orders, totalPage, totalItems };
    } catch (error) {
      return { ok: false, error: error?.message };
    }
  }

  // Update
  private isEditableRole(user: User, orderStatus: OrderStatus) {
    return user.role === UserRole.Owner
      ? this.allowedOrderStatus.ownerAllowedStatus.includes(orderStatus)
      : this.allowedOrderStatus.deliveryAllowedStatus.includes(orderStatus);
  }

  private isCertifiedUser(user: User, order: Order) {
    return user.role === UserRole.Client
      ? order.customer && order.customer.id === user.id
      : user.role === UserRole.Owner
      ? order.restaurant && order.restaurant.ownerId === user.id
      : user.role === UserRole.DeliveryMan
      ? order.driver && order.driver.id === user.id
      : true;
  }

  async editOrder(
    user: User,
    { id, orderStatus, reasonRejected }: EditOrderInput,
  ): Promise<EditOrderOutput> {
    try {
      if (!this.isEditableRole(user, orderStatus))
        throw new Error('not allowed user');

      const order = await this.orders.findOne(
        { id },
        { relations: ['customer', 'driver', 'restaurant'] },
      );
      if (!order) throw new Error('Could not found order');
      if (!this.isCertifiedUser(user, order))
        throw new Error('not allowed user');

      if (
        this.orderByOrderStatus.indexOf(orderStatus) <
        this.orderByOrderStatus.indexOf(order.orderStatus)
      )
        throw new Error("order status can't go back previous step");

      if (orderStatus === OrderStatus.Rejected) {
        await this.cancelOrder({ order, reasonRejected });
      }

      await this.orders.save({
        id,
        orderStatus,
        ...(user.role === UserRole.DeliveryMan &&
          orderStatus === OrderStatus.PickedUp && { driver: user }),
      });

      return { ok: true };
    } catch (error) {
      return { ok: false, error: error?.message };
    }
  }

  async pickedUpOrder(
    driver: User,
    { id }: PickedUpOrderInput,
  ): Promise<PickedUpOrderOutput> {
    try {
      const order = await this.orders.findOne(
        { id },
        { relations: ['driver'] },
      );
      if (!order) throw new Error('Could not found order');
      if (order.driver) throw new Error('driver already exist');

      await this.editOrder(driver, {
        id,
        orderStatus: OrderStatus.PickedUp,
      });

      return { ok: true };
    } catch (error) {
      return { ok: false, error: error?.message };
    }
  }

  async DeliveredOrder() {}

  // Delete
  async deleteOrder(
    user: User,
    { id: orderId }: DeleteOrderInput,
  ): Promise<DeleteOrderOutput> {
    try {
      const { order } = await this.getOrder(user, { orderId });
      if (!this.isCertifiedUser(user, order))
        throw new Error('not allowed user');
      if (!order.reasonRejected)
        throw new Error(
          '임의로 주문을 삭제할 수 없습니다. 취소사유를 입력하여 주문을 취소해주세요',
        );

      await this.orders.delete({ id: orderId });

      return { ok: true };
    } catch (error) {
      return { ok: false, error: error?.message };
    }
  }

  private async cancelOrder({
    order,
    reasonRejected: { reason, detail },
  }: CancelOrderInput): Promise<CancelOrderOutput> {
    try {
      if (order.orderStatus === OrderStatus.Rejected)
        throw new Error('취소된 주문입니다');
      if (!reason || (reason === CategoryReasonRejected.Other && !detail)) {
        throw new Error('취소 사유를 입력해주세요');
      }

      await this.orders.save({
        id: order.id,
        reasonRejected: { reason, detail },
      });

      return { ok: true };
    } catch (error) {
      return { ok: false, error: error?.message };
    }
  }
}
