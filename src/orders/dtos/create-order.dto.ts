import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { OrderMenuOption } from '../entities/orderMenu.entity';

/* 
  CreateOrderMenu {
    menuId,
    options?: [{name, choice}, ...],
  }
*/

@InputType()
export class CreateOrderMenu {
  @Field(type => Number)
  menuId: number;

  @Field(type => [OrderMenuOption], { nullable: true })
  options?: OrderMenuOption[]; // {name, choice}

  @Field(type => Number, { nullable: true })
  quantity?: number;
}

/* 
  CreateOrderInput {
    restaurantId: 1,
    orderMenuList: [
      {
        menuId: 4,
        options: [
          {
            name: 'size',
            choice: 'XL',
          },
          {
            name: '휘핑'
            choice: '휘핑O'
          },
          {
            name: '휘핑',
            choice: '휘핑 추가'
          }
        ],
        quantity: 2
      },
      {
        menuId: 1,
        quantity: 3
      }
    ]
  }
*/
@InputType()
export class CreateOrderInput {
  @Field(type => Number)
  restaurantId: number;

  @Field(type => [CreateOrderMenu])
  orderMenuList: CreateOrderMenu[];
}

@ObjectType()
export class CreateOrderOutput extends CoreOutput {}
