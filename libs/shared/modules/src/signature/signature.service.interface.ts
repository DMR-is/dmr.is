import {
  DefaultSearchParams,
  GetSignatureResponse,
  GetSignaturesQuery,
  GetSignaturesResponse,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

export interface ISignatureService {
  createSignature(): Promise<ResultWrapper>
  getSignature(id: string): Promise<ResultWrapper<GetSignatureResponse>>
  getSignatures(
    params?: GetSignaturesQuery,
  ): Promise<ResultWrapper<GetSignaturesResponse>>
  getSignaturesByInvolvedPartyId(
    involvedPartyId: string,
    params?: DefaultSearchParams,
  ): Promise<ResultWrapper<GetSignaturesResponse>>
  getSignaturesByCaseId(
    caseId: string,
    params?: DefaultSearchParams,
  ): Promise<ResultWrapper<GetSignaturesResponse>>
  getSignaturesByAdvertId(
    advertId: string,
    params?: DefaultSearchParams,
  ): Promise<ResultWrapper<GetSignaturesResponse>>
  updateSignature(): Promise<ResultWrapper>
  deleteSignature(): Promise<ResultWrapper>
}

export const ISignatureService = Symbol('ISignatureService')
