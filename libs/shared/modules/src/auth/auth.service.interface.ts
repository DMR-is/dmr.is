export interface IdsToken {
  access_token: string
  token_type: string
  expires_in: number
  scope: string
}

export interface IAuthService {
  getAccessToken(): Promise<IdsToken | null>
}

// Token for DI, based on https://stackoverflow.com/a/70088972
export const IAuthService = Symbol('IAuthService')