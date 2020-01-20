export const convertType = (value) => {
  let optionReturn;
  switch (option) {
    case 'false':
      optionReturn = false;
      break;
    case 'true':
      optionReturn = true;
      break;
    case 'null':
      optionReturn = null;
      break;
    default:
      optionReturn = option;
      break;
  }

  return optionReturn;
};

export const cleanOptionKey = (key) => {
  const str = key.replace('option', '');
  const cleanedKey = `${str.charAt(0).toLocaleLowerCase()}${str.slice(1)}`;
  return cleanedKey;
}
