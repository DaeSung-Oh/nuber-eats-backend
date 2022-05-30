import {
  Field,
  InputType,
  ObjectType,
  PartialType,
  PickType,
} from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { User } from 'src/users/entities/user.entity';
import { Order, ReasonRejected } from '../entities/order.entity';

@InputType()
export class PartialOrderInput extends PickType(Order, ['id', 'orderStatus']) {}

@InputType()
export class EditOrderInput extends PartialType(PartialOrderInput) {
  @Field(type => ReasonRejected, { nullable: true })
  reasonRejected?: ReasonRejected;
}

@ObjectType()
export class EditOrderOutput extends CoreOutput {}
