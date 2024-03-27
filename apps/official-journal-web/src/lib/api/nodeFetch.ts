import {
  Headers,
  HeadersInit,
  Request as NodeFetchRequest,
  RequestInfo as NodeRequestInfo,
  RequestInit as NodeFetchRequestInit,
  Response,
} from 'node-fetch'

class Request extends NodeFetchRequest {
  constructor(input: RequestInfo, init?: RequestInit) {
    super(input as NodeRequestInfo, init)
  }
}

interface URLLike {
  href: string
}

type RequestInfo = string | URLLike | Request

interface RequestInit extends NodeFetchRequestInit {}

type FetchAPI = (input: RequestInfo, init?: RequestInit) => Promise<Response>

type MiddlewareAPI = (request: Request) => Promise<Response>

interface FetchMiddlewareOptions {
  fetch: MiddlewareAPI
}

export { Headers, Request, Response }

export type {
  HeadersInit,
  RequestInfo,
  RequestInit,
  FetchAPI,
  FetchMiddlewareOptions,
  MiddlewareAPI,
}
