import { ObjectType } from '@nestjs/graphql';
import { CoreError } from '.';

@ObjectType()
class CurrentlyInUseError extends CoreError {
  constructor(message?: string) {
    super(message ?? 'CurrentlyInUse');
    this.type = this.constructor.name;
    this.name = 'Currently In Use';
  }
}

@ObjectType()
export class CurrentlyInUseEmailError extends CurrentlyInUseError {
  constructor() {
    super('This email is currently in use');
    this.type = 'Email';
  }
}

@ObjectType()
export class CurrentlyInUsePasswordError extends CurrentlyInUseError {
  constructor() {
    super('This Password is currently in use');
    this.type = 'Password';
  }
}
