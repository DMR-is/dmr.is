import {
  GetSignatureResponse,
  GetSignaturesQuery,
  GetSignaturesResponse,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

export interface ISignatureService {
  createSignature(): Promise<ResultWrapper>
  getSignatures(
    params?: GetSignaturesQuery,
  ): Promise<ResultWrapper<GetSignaturesResponse>>
  getSignature(id: string): Promise<ResultWrapper<GetSignatureResponse>>
  updateSignature(): Promise<ResultWrapper>
  deleteSignature(): Promise<ResultWrapper>
}

export const ISignatureService = Symbol('ISignatureService')
