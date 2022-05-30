import { ObjectType } from '@nestjs/graphql';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { User } from 'src/users/entities/user.entity';
import { CoreError } from '.';

@ObjectType()
export class RequiredFieldError extends CoreError {
  constructor(message?: string) {
    super(message);
    this.name = 'Required';
  }
}

@ObjectType()
export class RequiredUserFieldError extends RequiredFieldError {
  constructor(requireFields: (keyof User)[]) {
    super(`${requireFields.join(', ')} is required`);
    this.type = 'User';
  }
}

@ObjectType()
export class RequiredRestaurantFieldError extends RequiredFieldError {
  constructor(requireFields: (keyof Restaurant)[]) {
    super(`${requireFields.join(', ')} is required`);
    this.type = 'Restaurant';
  }
}
