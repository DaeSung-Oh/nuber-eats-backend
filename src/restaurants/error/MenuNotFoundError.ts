export class MenuNotFoundError extends Error {
  constructor() {
    super('Could not find menu');
  }
}
