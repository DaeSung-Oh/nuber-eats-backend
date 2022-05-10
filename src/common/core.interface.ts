import { BaseError } from './dtos/output.dto';

export interface ICoreError {
  error?: Error;
}

export interface ICoreErrors {
  [key: string]: Error;
}

export type BaseEditErrorsType<T, E = BaseError> = Partial<
  Record<keyof T | 'error', E>
>;
