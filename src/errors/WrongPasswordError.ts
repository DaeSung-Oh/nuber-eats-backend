import { ObjectType } from '@nestjs/graphql';
import { CoreError } from '.';

@ObjectType()
export class WrongPasswordError extends CoreError {
  constructor() {
    super('This Password is Incorrect Password');
    this.type = 'Password';
    this.name = 'Incorrect Password';
  }
}
