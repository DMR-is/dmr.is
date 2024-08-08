import { ResultWrapper } from '@dmr.is/types'

export interface ISignatureService {
  create(): Promise<ResultWrapper>
  remove(): Promise<ResultWrapper>
  update(): Promise<ResultWrapper>
  delete(): Promise<ResultWrapper>
}

export const ISignatureService = Symbol('ISignatureService')
