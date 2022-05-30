import { UserEntity } from './repositories/userRepository';

export const USER_ENTITY_KEYS: (keyof UserEntity)[] = [
  'id',
  'email',
  'password',
  'role',
  'emailVerified',
  'orders',
  'restaurants',
  'deliveryOrders',
];

export const USER_REG_EXP = {
  Email: {
    IsValidFormat: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/,
  },
  Password: {
    IsValidLength: /^.{8,16}$/,
    IsContainSpecialCharacter: /[!"#$%&'()*+,-./:;<=>?@^_`{|}~\[\]\\]{1,}/g,
  },
};

export const USER_ERROR_MESSAGES = {
  Email: {
    CurrentlyInUseError: {
      name: 'Currently In Use',
      message: 'This email currently in use',
    },
    InValidFormatError: {
      name: 'Invalid Format',
      message: 'This email is not in the format of the email',
    },
    AlreadyExistError: {
      name: 'Already Exist',
      message: 'This email already exists',
    },
  },
  Password: {
    CurrentlyInUseError: {
      name: 'Currently In Use',
      message: 'This password currently in use',
    },
    InValidLengthError: {
      name: 'Invalid Format',
      message:
        'Password must be at least 8 characters, no more than 16 characters',
    },
    NotContainSpecialCharacterError: {
      name: 'Not Included',
      message: 'At least one special character must be used',
    },
  },
  Required: {
    name: '',
    message: '',
  },
};
