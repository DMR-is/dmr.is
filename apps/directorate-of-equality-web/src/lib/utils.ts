import { CompanySizeEnum } from '../gen/fetch'

/* eslint-disable @typescript-eslint/no-non-null-assertion */
export const getBaseUrlFromServerSide = (includePrefix = false): string => {
  let url = ''
  if (process.env.NODE_ENV === 'development') {
    url = process.env.DOE_WEB_URL!
  } else {
    url = (process.env.BASE_URL ?? process.env.IDENTITY_SERVER_LOGOUT_URL)!
  }
  return includePrefix ? url : url.replace(/^https?:\/\//, '')
}

export const formatNationalId = (nationalId = '') => {
  // Format: XXXXXX-XXXX or XXXXXXXXXX or XXXXXX XXXX
  const cleaned = nationalId.replace(/[^0-9]/g, '')
  if (cleaned.length !== 10) {
    return nationalId // Return as is if not 10 digits
  }
  return `${cleaned.slice(0, 6)}-${cleaned.slice(6)}`
}

export const mapGender = (gender?: string) => {
  switch (gender) {
    case 'FEMALE':
      return 'Kona'
    case 'MALE':
      return 'Karl'
    case 'NEUTRAL':
      return 'Hlutlaus skráning kyns í Þjóðskrá'
    default:
      return 'Óþekkt'
  }
}

export const EMPLOYEE_RANGES = [
  { value: CompanySizeEnum.SMALL, label: '0–24' },
  { value: CompanySizeEnum.MEDIUM, label: '25–49' },
  { value: CompanySizeEnum.LARGE, label: '50+' },
  { value: CompanySizeEnum.UNKNOWN, label: 'Óþekkt' },
]

export const formatSalary = (v: number) =>
  new Intl.NumberFormat('is-IS').format(Math.round(v)).replaceAll(',', '.')

export const COMPANY_SIZE_LABEL: Record<CompanySizeEnum, string> = {
  [CompanySizeEnum.UNKNOWN]: 'Óþekkt',
  [CompanySizeEnum.SMALL]: '0–24',
  [CompanySizeEnum.MEDIUM]: '25–49',
  [CompanySizeEnum.LARGE]: '50+',
}
