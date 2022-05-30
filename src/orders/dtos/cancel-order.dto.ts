import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Order, ReasonRejected } from '../entities/order.entity';

@InputType()
export class CancelOrderInput {
  @Field(type => Order, { nullable: true })
  order: Order;
  @Field(type => ReasonRejected, { nullable: true })
  reasonRejected?: ReasonRejected;
}

@ObjectType()
export class CancelOrderOutput extends CoreOutput {}
