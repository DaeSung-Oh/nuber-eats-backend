export function isEmptyObject(obj: object): boolean {
  return Object.keys(obj).length === 0;
}

export function argsIsEmpty(args: object): boolean {
  const argsValues = Object.values(args);
  return argsValues.length === 0 || argsValues.some(arg => !arg);
}
