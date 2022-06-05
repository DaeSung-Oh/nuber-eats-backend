import {
  VerfificationEmailVar,
  WelcomeEmailVar,
} from 'src/mail/mail.interface';
import { CreateAccountInput } from './dtos/create-account.dto';
import { EditProfileInput } from './dtos/edit-profile.dto';
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

export const CREATE_ACCOUNT_INPUT_KEYS: (keyof CreateAccountInput)[] = [
  'email',
  'password',
  'role',
];

export const EDIT_PROFILE_INPUT_KEYS: (keyof EditProfileInput)[] = [
  'email',
  'password',
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

export const USER_ERROR_TEMPLATE = {
  Email: {
    CurrentlyInUseError: {
      type: 'Email',
      name: 'Currently In Use',
      message: 'This email currently in use',
    },
    InValidFormatError: {
      type: 'Email',
      name: 'Invalid Format',
      message: 'This email is not in the format of the email',
    },
    AlreadyExistError: {
      type: 'Email',
      name: 'Already Exist',
      message: 'This email already exists',
    },
  },
  Password: {
    CurrentlyInUseError: {
      type: 'Password',
      name: 'Currently In Use',
      message: 'This password currently in use',
    },
    InValidLengthError: {
      type: 'Password',
      name: 'Invalid Format',
      message:
        'Password must be at least 8 characters, no more than 16 characters',
    },
    NotContainSpecialCharacterError: {
      type: 'Password',
      name: 'Not Included',
      message: 'At least one special character must be used',
    },
  },
  Required: {
    name: '',
    message: '',
  },
};
