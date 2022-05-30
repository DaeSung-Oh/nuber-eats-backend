import { Field, ObjectType } from '@nestjs/graphql';

const NAME = 'Not Accept';
const MESSAGE = 'User is not permission to this restaurant';

@ObjectType()
export class NotPermissionToRestaurantError {
  @Field(type => String, { defaultValue: 'Restaurant' })
  type: string;
  @Field(type => String, { defaultValue: NAME })
  name: string;
  @Field(type => String, { defaultValue: MESSAGE })
  message: string;
  @Field(type => String, { nullable: true, defaultValue: new Error().stack })
  stack?: string;
}
