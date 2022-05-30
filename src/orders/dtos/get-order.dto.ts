import { Field, InputType, ObjectType, PartialType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Order } from '../entities/order.entity';

@InputType()
export class GetOrderInput {
  @Field(type => Number)
  orderId: number;
}

@ObjectType()
export class GetOrderOutput extends CoreOutput {
  @Field(type => Order, { nullable: true })
  order?: Order;
}
