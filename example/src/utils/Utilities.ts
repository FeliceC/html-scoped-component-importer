export const convertType = (value: string): boolean | null | string => {
  switch (value) {
    case 'false': return false;
    case 'true': return true;
    case 'null': return null;
    default: return value;
  }
};

export const cleanOptionKey = (key: string): string => {
  const str = key.replace('option', '');
  return `${str.charAt(0).toLocaleLowerCase()}${str.slice(1)}`;
};
