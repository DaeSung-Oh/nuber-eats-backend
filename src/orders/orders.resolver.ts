import {
  Args,
  Context,
  GqlExecutionContext,
  Mutation,
  Query,
  Resolver,
  Subscription,
} from '@nestjs/graphql';
import { Inject } from '@nestjs/common';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { Role } from 'src/auth/role.decorator';
import { User } from 'src/users/entities/user.entity';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { Order } from './entities/order.entity';
import { OrderService } from './orders.service';
import { PUB_SUB } from 'src/common/common.constants';
import { PubSub } from 'graphql-subscriptions';
import { GetOrdersInput, GetOrdersOutput } from './dtos/get-orders.dto';
import { PaginationConfig } from 'src/common/dtos/pagination.dto';
import { GetOrderInput, GetOrderOutput } from './dtos/get-order.dto';
import { EditOrderInput, EditOrderOutput } from './dtos/edit-order.dto';
import { CancelOrderInput, CancelOrderOutput } from './dtos/cancel-order.dto';
import { DeleteOrderInput, DeleteOrderOutput } from './dtos/delete-order.dto';
import {
  PickedUpOrderInput,
  PickedUpOrderOutput,
} from './dtos/pickedUpOrder.dto';

@Resolver(of => Order)
export class OrderResolver {
  constructor(
    private readonly ordersService: OrderService,
    @Inject(PUB_SUB) private readonly pubSub: PubSub,
  ) {}

  @Mutation(returns => CreateOrderOutput)
  @Role(['Client'])
  createOrder(
    @AuthUser() customer: User,
    @Args('input') createOrderInput: CreateOrderInput,
  ): Promise<CreateOrderOutput> {
    return this.ordersService.createOrder(customer, createOrderInput);
  }

  @Query(returns => GetOrderOutput)
  @Role(['Any'])
  getOrder(
    @AuthUser() user: User,
    @Args('input') getOrderInput: GetOrderInput,
  ): Promise<GetOrderOutput> {
    return this.ordersService.getOrder(user, getOrderInput);
  }

  @Query(returns => GetOrdersOutput)
  @Role(['Any'])
  getOrders(
    @AuthUser() user: User,
    @Args('input') getOrdersInput: GetOrdersInput,
    @Args('paginationConfig') paginationConfig: PaginationConfig,
  ): Promise<GetOrdersOutput> {
    return this.ordersService.getOrders(user, getOrdersInput, paginationConfig);
  }

  @Mutation(returns => EditOrderOutput)
  @Role(['Owner', 'DeliveryMan'])
  editOrder(
    @AuthUser() user: User,
    @Args('input') editOrderInput: EditOrderInput,
  ): Promise<EditOrderOutput> {
    return this.ordersService.editOrder(user, editOrderInput);
  }

  @Mutation(returns => PickedUpOrderOutput)
  @Role(['DeliveryMan'])
  pickedUpOrder(
    @AuthUser() driver: User,
    @Args('input') pickedUpOrderInput: PickedUpOrderInput,
  ): Promise<PickedUpOrderOutput> {
    return this.ordersService.pickedUpOrder(driver, pickedUpOrderInput);
  }

  @Mutation(returns => DeleteOrderOutput)
  @Role(['Owner'])
  deleteOrder(
    @AuthUser() user: User,
    @Args('input') deleteOrderInput: DeleteOrderInput,
  ): Promise<DeleteOrderOutput> {
    return this.ordersService.deleteOrder(user, deleteOrderInput);
  }

  // @Mutation(returns => CancelOrderOutput)
  // @Role(['Owner'])
  // cancelOrder(
  //   @AuthUser() user: User,
  //   @Args('input') cancelOrderInput: CancelOrderInput,
  // ): Promise<CancelOrderOutput> {
  //   return this.ordersService.cancelOrder(user, cancelOrderInput);
  // }

  // @Mutation(returns => Boolean)
  // async returnUser(): Promise<boolean> {
  //   const user = { name: 'mike', age: 14 };
  //   this.pubSub.publish('createdUser', { loadUser: user });
  //   return true;
  // }

  // @Subscription(returns => SubscriptionOutput)
  // loadUser() {
  //   return this.pubSub.asyncIterator('createdUser');
  // }
}
