export const isSingular = (n: number | string): boolean => {
  const c = '' + Number(n)
  return c.slice(-1) === '1' && c.slice(-2) !== '11'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isReponse = (error: any): error is Response => {
  return 'json' in error
}

export const ICELANDIC_ALPHABET = 'AÁBDÐEÉFGHIÍJKLMNOÓPRSTUÚVXYÝÞÆÖ'

export const sortAlphabetically = (a: string, b: string) => {
  return a.localeCompare(b, 'is', { sensitivity: 'base' })
}