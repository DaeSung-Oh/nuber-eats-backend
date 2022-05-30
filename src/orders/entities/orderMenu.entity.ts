import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsNumber } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Menu } from 'src/restaurants/entities/menu.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

@InputType('OrderItemOptionInputType', { isAbstract: true })
@ObjectType()
export class OrderMenuOption {
  @Field(type => String)
  name: string;

  @Field(type => String)
  choice: string;
}

@InputType('OrderItemInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class OrderMenu extends CoreEntity {
  @ManyToOne(type => Menu, { nullable: true, onDelete: 'CASCADE' })
  @Field(type => Menu)
  menu: Menu;

  @Column({ type: 'json', nullable: true })
  @Field(type => [OrderMenuOption], { nullable: true })
  options?: OrderMenuOption[];

  @Column({ default: 1 })
  @Field(type => Number, { defaultValue: 1 })
  @IsNumber()
  quantity: number;
}
