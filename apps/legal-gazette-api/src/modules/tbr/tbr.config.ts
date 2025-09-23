export interface ITBRConfig {
  credentials: string
  tbrPath: string
  officeId: string
  chargeCategory: string
}

export const ITBRConfig = Symbol('ITBRConfig')
