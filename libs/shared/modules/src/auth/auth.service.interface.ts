export interface IAuthService {
  getAccessToken(): Promise<string | null>
}

// Token for DI, based on https://stackoverflow.com/a/70088972
export const IAuthService = Symbol('IAuthService')
