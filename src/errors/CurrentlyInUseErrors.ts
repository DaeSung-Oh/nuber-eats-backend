import { ObjectType } from '@nestjs/graphql';
import { USER_ERROR_TEMPLATE } from 'src/users/users.constants';
import { CoreError } from '.';

const [
  {
    type: currentlyInUseEmailErrorType,
    message: currentlyInUseEmailErrorMessage,
  },
  {
    type: currentlyInUsePasswordErrorType,
    message: currentlyInUsePasswordErrorMessage,
  },
] = [
  USER_ERROR_TEMPLATE.Email.CurrentlyInUseError,
  USER_ERROR_TEMPLATE.Password.CurrentlyInUseError,
];

@ObjectType()
class CurrentlyInUseError extends CoreError {
  constructor(message?: string) {
    super(message ?? 'Currently In Use');
    this.type = this.constructor.name;
    this.name = 'Currently In Use';
  }
}

@ObjectType()
export class CurrentlyInUseEmailError extends CurrentlyInUseError {
  constructor() {
    super(currentlyInUseEmailErrorMessage);
    this.type = currentlyInUseEmailErrorType;
  }
}

@ObjectType()
export class CurrentlyInUsePasswordError extends CurrentlyInUseError {
  constructor() {
    super(currentlyInUsePasswordErrorMessage);
    this.type = currentlyInUsePasswordErrorType;
  }
}
