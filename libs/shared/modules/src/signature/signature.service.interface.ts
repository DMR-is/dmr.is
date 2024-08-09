import { Transaction } from 'sequelize'
import {
  CreateSignatureBody,
  DefaultSearchParams,
  GetSignatureResponse,
  GetSignaturesResponse,
  UpdateSignatureBody,
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

  createSignature(
    body: CreateSignatureBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper>
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
  updateSignature(
    id: string,
    body: UpdateSignatureBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper>
  deleteSignature(
    signatureId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper>
}

export const ISignatureService = Symbol('ISignatureService')
