export class RestaurantNotFoundError extends Error {
  constructor() {
    super('Could not find Restaurant');
  }
}
