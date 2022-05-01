import { ICoreError } from 'src/common/core.interface';

export const validEmail = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/;

export interface IEditProfileErrors extends ICoreError {
  email?: Error;
  password?: Error;
}
