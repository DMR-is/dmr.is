export interface IdsToken {
  access_token: string
  token_type: string
  expires_in: number
  scope: string
}

export interface IAuthService {
  getAccessToken(): Promise<IdsToken | null>

  xroadFetch(
    url: string,
    options: RequestInit,
    xroadClient?: string,
  ): Promise<Response>
}

export const IAuthService = Symbol('IAuthService')
