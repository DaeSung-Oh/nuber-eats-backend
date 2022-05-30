import {
  Field,
  InputType,
  ObjectType,
  PartialType,
  PickType,
} from '@nestjs/graphql';
import { PaginationOutput } from 'src/common/dtos/pagination.dto';
import { Order, OrderStatus } from '../entities/order.entity';

@InputType()
class GetOrdersFilter extends PartialType(
  PickType(Order, ['orderStatus', 'createdAt', 'totalPrice']),
) {
  @Field(type => OrderStatus, { nullable: true })
  orderStatus?: OrderStatus;
}

@InputType()
export class GetOrdersInput {
  @Field(type => GetOrdersFilter, { nullable: true })
  filter?: GetOrdersFilter;
}

@ObjectType()
export class GetOrdersOutput extends PaginationOutput {
  @Field(type => [Order], { nullable: true })
  orders?: Order[];
}
