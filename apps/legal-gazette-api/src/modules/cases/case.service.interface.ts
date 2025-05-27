export interface ICaseService {
  create(body: any): void

  createCommonCase(body: any): void
}

export const ICaseService = Symbol('ICaseService')
