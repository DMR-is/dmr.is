export interface ITBRConfig {
  credentials: string
  tbrPath: string
  officeId: string
}

export const ITBRConfig = Symbol('ITBRConfig')
