import { Field, ObjectType } from '@nestjs/graphql';
import { PaginationOutput } from 'src/common/dtos/pagination.dto';
import { Category } from '../../entities/category.entity';

@ObjectType()
export class AllCategoriesOutput extends PaginationOutput {
  @Field(type => [Category], { nullable: true })
  categories?: Category[];
}
