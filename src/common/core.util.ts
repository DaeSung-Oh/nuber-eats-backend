export function isEmptyObject(obj: object): boolean {
  return Object.keys(obj).length === 0;
}

export function argsContainEmptyValue(args: object): boolean {
  const argsValues = Object.values(args);
  return argsValues.length === 0 || argsValues.some(arg => !arg);
}

export function firstLetterToUpperCase(str: string): string {
  return str.replace(/^[a-zA-Z]/, str.charAt(0).toUpperCase());
}

export const base64Encoding = (message: string) => {
  return Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
};

export const translateKr = (message: string) => {
  return `=?UTF-8?B?${Buffer.from(message).toString('base64')}?=`;
};

export const isOfType = <T>(
  obj: unknown,
  propertyToCheck: (keyof T)[],
): obj is T => {
  if (typeof obj !== 'object' || isEmptyObject(obj)) return false;

  const objKeys = Object.keys(obj);

  const containedKeys = objKeys.filter(property =>
    propertyToCheck.includes(property as any),
  );

  return objKeys.length === containedKeys.length;
};

export const isOfRequiredType = <T>(
  obj: unknown,
  propertyToCheck: (keyof T)[],
): obj is T => {
  if (typeof obj !== 'object' || isEmptyObject(obj)) return false;

  const objKeys = Object.keys(obj);

  return propertyToCheck.every(requiredProperty =>
    objKeys.includes(requiredProperty as any),
  );
};

export const asObjectType = <T>(obj: unknown): obj is T => {
  return true;
};

export const parseDate: (numeric: number) => string = (numeric: number) => {
  return new Date(numeric).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  });
};
