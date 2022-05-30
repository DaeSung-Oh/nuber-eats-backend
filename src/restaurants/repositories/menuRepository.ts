import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { MenuNotFoundError } from 'src/errors/NotFoundErrors';
import {
  OrderMenu,
  OrderMenuOption,
} from 'src/orders/entities/orderMenu.entity';
import { OrderMenuRepository } from 'src/orders/repositories/orderMenuRepository';
import { EntityRepository, getCustomRepository, Repository } from 'typeorm';
import { Menu } from '../entities/menu.entity';

@InputType()
export class CalcMenuPriceAndCreateInput {
  @Field(type => Number)
  menuId: number;
  @Field(type => [OrderMenuOption], { nullable: true })
  options?: OrderMenuOption[];
  @Field(type => Number, { nullable: true })
  quantity?: number;
}
@ObjectType()
export class CalcMenuPriceAndCreateOutput {
  @Field(type => Number)
  menuPrice: number;
  @Field(type => Number)
  extraPrice: number;
  @Field(type => OrderMenu)
  createdOrderMenu: OrderMenu;
}

@InputType()
export class CalcMenuPriceInput {
  @Field(type => Number)
  menuId: number;
  @Field(type => [OrderMenuOption])
  options?: OrderMenuOption[];
  @Field(type => Number, { nullable: true })
  quantity?: number;
}
@ObjectType()
export class CalcMenuPriceOutput {
  @Field(type => Number)
  menuPrice: number;
  @Field(type => Number)
  extraPrice: number;
}

@EntityRepository(Menu)
export class MenuRepository extends Repository<Menu> {
  private readonly orderMenuRepository: OrderMenuRepository;

  constructor() {
    super();
    this.orderMenuRepository = getCustomRepository(OrderMenuRepository);
  }

  private async clacMenuPrice({
    menuId,
    options,
    quantity,
  }: CalcMenuPriceInput): Promise<CalcMenuPriceOutput> {
    try {
      const menu = await this.findOne({ id: menuId });
      if (!menu) throw new MenuNotFoundError();

      const result: CalcMenuPriceOutput = {
        menuPrice: menu.price * quantity,
        extraPrice: 0,
      };

      if (!menu?.options) return result;

      options.forEach(({ name: userOptionName, choice: userChoice }) => {
        const option = menu.options?.find(
          ({ name: menuOptionName }) => menuOptionName === userOptionName,
        );
        if (!option) throw new Error('Could not found selected option');

        const choice = option.choices?.find(
          ({ name: menuChoice }) => menuChoice === userChoice,
        );
        if (!choice) throw new Error('Could not found selected choice');

        const extraPrice = result.extraPrice + choice.extraPrice;
        Object.assign(result, { ...result, extraPrice });
      });

      return result;
    } catch (error) {
      throw error;
    }
  }

  async calcMenuPriceAndCreate(
    calcMenuPriceAndCreateInput: CalcMenuPriceAndCreateInput,
  ): Promise<CalcMenuPriceAndCreateOutput> {
    try {
      const { menuPrice, extraPrice } = await this.clacMenuPrice(
        calcMenuPriceAndCreateInput,
      );

      const { menuId, options, quantity } = calcMenuPriceAndCreateInput;
      const menu = await this.findOne({ id: menuId });

      const createdOrderMenu = await this.orderMenuRepository.create({
        menu,
        ...(options && { options }),
        quantity,
      });

      return { menuPrice, extraPrice, createdOrderMenu };
    } catch (error) {
      throw error;
    }
  }
}
