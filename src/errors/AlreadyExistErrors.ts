import { ObjectType } from '@nestjs/graphql';
import { firstLetterToUpperCase } from 'src/common/core.util';
import { CoreError } from '.';

@ObjectType()
export class AlreadyExistError<T = any> extends CoreError {
  constructor(alreadyExistField: keyof T) {
    super(
      `${firstLetterToUpperCase(
        alreadyExistField as string,
      )} is already exists`,
    );
    this.type = this.constructor.name;
    this.name = 'Already Exist';
  }
}
