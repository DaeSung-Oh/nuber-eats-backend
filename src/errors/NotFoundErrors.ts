import { ObjectType } from '@nestjs/graphql';
import { CoreError } from '.';

@ObjectType()
export class NotFoundError extends CoreError {
  constructor(message?: string) {
    super(message ?? 'Could Not Found');
    this.type = this.constructor.name;
    this.name = 'Not Found';
  }
}

@ObjectType()
export class VerificationNotFoundError extends NotFoundError {
  constructor() {
    super('Could Not Found Verification');
    this.type = 'Verification';
  }
}

@ObjectType()
export class UserNotFoundError extends NotFoundError {
  constructor() {
    super('Could Not Found User');
    this.type = 'User';
  }
}

@ObjectType()
export class RestaurantNotFoundError extends NotFoundError {
  constructor() {
    super('Could Not Found Restaurnat');
    this.type = 'Restaurant';
  }
}

@ObjectType()
export class OrderNotFoundError extends NotFoundError {
  constructor() {
    super('Could Not Found Order');
    this.type = 'Order';
  }
}

@ObjectType()
export class MenuNotFoundError extends NotFoundError {
  constructor() {
    super('Could Not Found Menu');
    this.type = 'Menu';
  }
}
