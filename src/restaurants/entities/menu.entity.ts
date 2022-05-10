import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsNumber, IsString, MaxLength } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Column, Entity, ManyToOne, RelationId } from 'typeorm';
import { Restaurant } from './restaurant.entity';

@InputType('MenuInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Menu extends CoreEntity {
  @Column()
  @Field(type => String)
  @IsString()
  @MaxLength(25)
  name: string;

  @Column()
  @Field(type => Number)
  @IsNumber()
  price: number;

  @Column({ nullable: true })
  @Field(type => String, { nullable: true })
  @IsString()
  photo?: string;

  @Column({ nullable: true })
  @Field(type => String, { nullable: true })
  @IsString()
  @MaxLength(255)
  description: string;

  @ManyToOne(type => Restaurant, restaurant => restaurant.menus, {
    onDelete: 'CASCADE',
  })
  @Field(type => Restaurant)
  restaurant: Restaurant;

  @RelationId((menu: Menu) => menu.restaurant)
  restaurantId?: number;
}
