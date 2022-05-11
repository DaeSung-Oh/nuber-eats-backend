export class UserIsNotPermissionToRestaurantError extends Error {
  constructor() {
    super('User is not permission to this restaurant');
  }
}
