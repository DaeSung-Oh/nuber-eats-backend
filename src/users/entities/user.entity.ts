import {
  Field,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { CoreEntity } from 'src/common/entities/core.entity';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  OneToMany,
  ChildEntity,
  TableInheritance,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { InternalServerErrorException, Param } from '@nestjs/common';
import { IsBoolean, IsEnum, IsString } from 'class-validator';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { Order } from 'src/orders/entities/order.entity';

export enum UserRole {
  Client = 'Client',
  Owner = 'Owner',
  DeliveryMan = 'DeliveryMan',
}

registerEnumType(UserRole, { name: 'UserRole' });

@InputType('UserInputType', { isAbstract: true })
@ObjectType()
@Entity()
@TableInheritance({
  column: { type: 'enum', enum: UserRole, name: 'role' },
})
export class User extends CoreEntity {
  @Column({ unique: true })
  @Field(type => String)
  @IsString()
  email: string;

  @Column({ select: false })
  @Field(type => String)
  @IsString()
  password: string;

  @Column({ type: 'enum', enum: UserRole })
  @Field(type => UserRole)
  @IsEnum(UserRole)
  role: UserRole;

  @Column({ default: false })
  @Field(type => Boolean)
  @IsBoolean()
  emailVerified: boolean;

  // relations

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword(): Promise<void> {
    try {
      if (this.password) {
        this.password = await bcrypt.hash(this.password, 10);
      }
    } catch (e) {
      throw new InternalServerErrorException();
    }
  }

  async checkPassword(inputPassword: string): Promise<boolean> {
    try {
      const isUserPassword = await bcrypt.compare(inputPassword, this.password);
      return isUserPassword;
    } catch (e) {
      throw new InternalServerErrorException();
    }
  }
}

@InputType('ClientInputType', { isAbstract: true })
@ObjectType()
@ChildEntity(UserRole.Client)
export class Client extends User {
  @OneToMany(type => Order, order => order.customer)
  @Field(type => [Order])
  orders: Order[];
}

@InputType('OwnerInputType', { isAbstract: true })
@ObjectType()
@ChildEntity(UserRole.Owner)
export class Owner extends User {
  @OneToMany(type => Restaurant, restaurant => restaurant.owner)
  @Field(type => [Restaurant])
  restaurants: Restaurant[];

  @OneToMany(type => Order, order => order.restaurant.owner)
  @Field(type => [Order])
  orders: Order[];

  // owner Methods

  // 주문 취소
  cancelOrder(orderId: number) {}
}

@InputType('DeliveryManInputType', { isAbstract: true })
@ObjectType()
@ChildEntity(UserRole.DeliveryMan)
export class DeliveryMan extends User {
  @OneToMany(type => Order, order => order.driver)
  @Field(type => [Order])
  deliveryOrders: Order[];

  // deliveryMan Methods

  // 배달할 주문 수락
  takeOrder(orderId: number) {}

  // 주문된 상품 픽업
  pickedUpOrder(orderId: number) {}

  // 주문된 상품 배달 완료
  deliveredOrder(orderId: number) {}
}

@ObjectType()
export class GqlUser extends User {
  @Field(type => [Restaurant], { nullable: true })
  restaurants?: Restaurant[];
  @Field(type => [Order], { nullable: true })
  orders?: Order[];
  @Field(type => [Order], { nullable: true })
  deliveryOrders?: Order[];
}
