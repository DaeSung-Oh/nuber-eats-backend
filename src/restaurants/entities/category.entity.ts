import {
  Field,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { IsEnum, IsString } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Column, Entity, JoinColumn, OneToMany } from 'typeorm';
import { Restaurant } from './restaurant.entity';

export enum Categories {
  KoreanFood = '한식',
  SchoolFood = '분식',
  JapaneseFood = `돈까스ㆍ회ㆍ일식`,
  ChineseFood = '중식',
  CafeAndDesert = `카페ㆍ디저트`,
  Chicken = '치킨',
  FastFood = '패스트푸드',
}

registerEnumType(Categories, { name: 'Categories' });

@InputType('CategoryInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Category extends CoreEntity {
  @Column({ type: 'enum', enum: Categories })
  @Field(type => Categories)
  @IsEnum(Categories)
  name: Categories;

  @Column()
  @Field(type => String)
  @IsString()
  coverImage: string;

  @OneToMany(type => Restaurant, restaurant => restaurant.category, {
    nullable: true,
  })
  @Field(type => [Restaurant], { nullable: true })
  restaurants?: Restaurant[];
}
