import { Transaction } from 'sequelize'
import {
  CreateSignatureBody,
  DefaultSearchParams,
  GetSignatureResponse,
  GetSignaturesResponse,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

export interface ISignatureService {
  createAdvertSignature(
    signatureId: string,
    advertId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper>
  createCaseSignature(
    signatureId: string,
    caseId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper>

  createSignature(body: CreateSignatureBody): Promise<ResultWrapper>
  getSignature(id: string): Promise<ResultWrapper<GetSignatureResponse>>
  getSignatures(
    params?: DefaultSearchParams,
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
  deleteSignature(signatureId: string): Promise<ResultWrapper>
}

export const ISignatureService = Symbol('ISignatureService')
