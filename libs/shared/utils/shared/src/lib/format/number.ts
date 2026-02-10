export const numberFormat = (value: number): string =>
  value
    .toString()
    .split('.')[0]
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.')

export const amountFormat = (value?: number | string | null): string => {
  const inputValue = typeof value === 'string' ? parseInt(value) : value
  if (inputValue === undefined || inputValue === null || isNaN(inputValue)) {
    return ''
  }
  return typeof inputValue === 'number' ? numberFormat(inputValue) + ' kr.' : ''
}
