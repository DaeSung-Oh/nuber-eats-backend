import { FindManyOptions, FindOneOptions } from './common.repository.interface';

export const CONFIG_OPTIONS = 'CONFIG_OPTIONS';
export const PUB_SUB = 'PUB_SUB';

export const FIND_ONE_OPTIONS_KEYS: (keyof FindOneOptions<any>)[] = [
  'where',
  'select',
  'relations',
];
export const FIND_MANY_OPTIONS_KEYS: (keyof FindManyOptions<any>)[] = [
  ...FIND_ONE_OPTIONS_KEYS,
  'skip',
  'take',
];

export const utilError = {
  argsIsEmptyError: {
    name: 'invalid form',
    message: 'This is not a valid input form',
  },
};
