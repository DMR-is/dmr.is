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
  createSignature(
    body: CreateSignatureBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper>

  createCaseSignature(
    body: CreateSignatureBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper<{ id: string }>>

  getSignature(id: string): Promise<ResultWrapper<GetSignatureResponse>>
  getSignatures(
    params?: DefaultSearchParams,
  ): Promise<ResultWrapper<GetSignaturesResponse>>
  getSignatureForInvolvedParty(
    involvedPartyId: string,
    params?: DefaultSearchParams,
  ): Promise<ResultWrapper<GetSignaturesResponse>>
  getSignaturesByCaseId(
    caseId: string,
    params?: DefaultSearchParams,
    transaction?: Transaction,
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
