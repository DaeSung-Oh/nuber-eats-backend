import { NonFunctionalFieldName, NonFunctionalFields } from './core.interface';

export interface FindOneOptions<T> {
  where?: NonFunctionalFields<T>;
  select?: NonFunctionalFieldName<T>[];
  relations?: string[];
}

export interface FindManyOptions<T> extends FindOneOptions<T> {
  skip?: number;
  take?: number;
}

export type FindConditions<T> = NonFunctionalFields<T>;
