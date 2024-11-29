import { JWT } from 'next-auth/jwt'

type FetchAPI = WindowOrWorkerGlobalScope['fetch']

interface FetchParams {
  url: string
  init: RequestInit
}

interface RequestContext {
  fetch: FetchAPI
  url: string
  init: RequestInit
}

interface Middleware {
  pre?(context: RequestContext): Promise<FetchParams | void>
}

export class AuthMiddleware implements Middleware {
  constructor(private token?: string) {}

  async pre(context: RequestContext) {
    context.init.headers = {
      ...context.init.headers,
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    }
    return context
  }
}
