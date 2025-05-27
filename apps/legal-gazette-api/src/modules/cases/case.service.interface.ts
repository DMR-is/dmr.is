export interface ICaseService {
  create(body: any): void
}

export const ICaseService = Symbol('ICaseService')
