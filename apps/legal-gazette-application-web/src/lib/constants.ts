export enum PageRoutes {
  LOGIN = '/innskraning',
  FRONTPAGE = '/',
  APPLICATIONS = '/umsoknir',
  APPLICATION_THROTABU = '/umsoknir/innkollun-throtabus',
  APPLICATION_DANARBU = '/umsoknir/innkollun-danarbus',
  APPLICATION_COMMON = '/umsoknir/almenn-umsokn',
  ISLAND_IS_COMMONA_APPLICATION = 'https://island.is/umsoknir/logbirtingarblad',
}

export enum DateFormats {
  DEFAULT = 'dd.MM.yyyy',
  LONG = 'dd. MMMM yyyy',
}

export const ONE_DAY = 1
export const ONE_WEEK = 7 * ONE_DAY
export const TWO_WEEKS = 14 * ONE_DAY

export enum FormTypes {
  BANKRUPTCY = 'innkollun-throtabus',
  DECEASED = 'innkollun-danarbus',
  COMMON = 'almenn-umsokn',
}

export const ALLOWED_FORM_TYPES = Object.values(FormTypes)
