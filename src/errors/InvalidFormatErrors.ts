import { Field, ObjectType } from '@nestjs/graphql';
import { CoreError } from 'src/errors';

@ObjectType()
class InvalidFormatError extends CoreError {
  constructor(message?: string) {
    super(message ?? 'Invalid Format Error');
    this.type = this.constructor.name;
    this.name = 'Invalid Format';
  }
}

@ObjectType()
export class InvalidEmailFormatError extends InvalidFormatError {
  constructor() {
    super('This email is not in the format of the email');
    this.type = 'Email';
  }
}

@ObjectType()
export class InvalidPasswordLengthError extends InvalidFormatError {
  constructor() {
    super('Password must be at least 8 characters, no more than 16 characters');
    this.type = 'Password';
  }
}

@ObjectType()
export class PasswordNotContainSpecialError extends InvalidFormatError {
  constructor() {
    super('At least one special character must be used');
    this.type = 'Password';
  }
}

// @ObjectType()
// export class InvalidEmailFormatError extends EntityFieldError<User> {
//   constructor() {
//     super();
//     this.name = 'invalidFormat';
//     this.type = this.constructor.name;
//     this.fields = {
//       email: {
//         ...new Error(MESSAGE),
//         name: NAME,
//       },
//     };
//   }
// }
