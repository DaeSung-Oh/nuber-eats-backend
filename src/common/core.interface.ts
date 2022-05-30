export type NonFunctionalFieldName<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => infer R ? never : K;
}[keyof T];
export type NonFunctionalFieldNames<T> = NonFunctionalFieldName<T>[];
export type NonFunctionalFields<T> = {
  [K in NonFunctionalFieldName<T>]?: T[K];
};
