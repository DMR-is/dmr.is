export interface ITBRConfig {
  credentials: string
  tbrBasePath: string
  officeId: string
}

export const ITBRConfig = Symbol('ITBRConfig')
