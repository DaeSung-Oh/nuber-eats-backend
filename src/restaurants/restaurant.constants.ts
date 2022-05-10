export const restaurantRegExp = {
  name: {
    isValidFormat: /[!"#$%&'()*+,-./:;<=>?@^_`{|}~\[\]\\]{1,}/g,
  },
  coverImage: {
    isValidFormat: /^(https?:\/\/)/,
  },
};

export const restaurantFieldErrors = {
  name: {
    invalidFormatError: {
      name: 'invalid format',
      message: 'name is not contain special character',
    },
  },
  coverImage: {
    invalidFormatError: {
      name: 'invalid format',
      message: `coverImage must URI(ex. https://)`,
    },
  },
};
