export function isEmptyObject(obj: object): boolean {
  return Object.keys(obj).length === 0;
}

export function argsContainEmptyValue(args: object): boolean {
  const argsValues = Object.values(args);
  return argsValues.length === 0 || argsValues.some(arg => !arg);
}

export function firstLetterToUpperCase(str: string): string {
  return /^[A-Z]/.test(str)
    ? str
    : str.replace(/^[a-zA-Z]/, str.charAt(0).toUpperCase());
}

export const isOfType = <T>(obj: unknown, propertyToCheck: (keyof T)[]) => {
  if (typeof obj !== 'object' || isEmptyObject(obj)) return false;

  const objKeys = Object.keys(obj);

  const containedKeys = objKeys.filter(property =>
    propertyToCheck.includes(property as any),
  );

  return objKeys.length === containedKeys.length;
};
