export const userRegExp = {
  email: {
    isValidFormat: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/,
  },
  password: {
    isValidLength: /^.{8,16}$/,
    isContainSpecialCharacter: /[!"#$%&'()*+,-./:;<=>?@^_`{|}~\[\]\\]{1,}/g,
  },
};

export const userFieldErrors = {
  email: {
    currentlyInUseError: {
      name: 'currently in use',
      message: 'This email currently in use',
    },
    inValidFormatError: {
      name: 'invalid email form',
      message: 'This email is not in the format of the email',
    },
    alreadyExistError: {
      name: 'already exist',
      message: 'This email already exists',
    },
  },
  password: {
    currentlyInUseError: {
      name: 'currently in use',
      message: 'This password currently in use',
    },
    inValidLengthError: {
      name: 'invalid password length',
      message:
        'Password must be at least 8 characters, no more than 16 characters',
    },
    notContainSpecialCharacterError: {
      name: 'special characters not included',
      message: 'At least one special character must be used',
    },
  },
};
