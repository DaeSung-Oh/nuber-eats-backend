import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsNumber, IsString, MaxLength } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Column, Entity, ManyToOne, RelationId } from 'typeorm';
import { Restaurant } from './restaurant.entity';

/* 
  options?: MenuOption[];

  [
    {
      name: 사이즈,
      choices: [
        {
          name: Large,
          extraPrice: 500
        }, ...
      ]
    },
    {
      name: 휘핑
      choices: [
        {
          name: 휘핑O,
          extraPrice: 0
        },
        {
          name: 휘핑 추가,
          extraPrice: 500
        }
      ]
    } 
    
    ...
  ]
*/
@InputType('MenuOptionChoiceInputType', { isAbstract: true })
@ObjectType()
class Choice {
  @Field(type => String)
  name: string;

  @Field(type => Number, { nullable: true })
  extraPrice?: number;
}

@InputType('MenuOptionInputType', { isAbstract: true })
@ObjectType()
class MenuOption {
  @Field(type => String)
  name: string;

  @Field(type => [Choice], { nullable: true })
  choices?: Choice[];
}

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

  @Column({ type: 'json', nullable: true })
  @Field(type => [MenuOption], { nullable: true })
  options?: MenuOption[];

  //relations
  @ManyToOne(type => Restaurant, restaurant => restaurant.menus, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @Field(type => Restaurant)
  restaurant: Restaurant;
  @RelationId((menu: Menu) => menu.restaurant)
  restaurantId?: number;
}
