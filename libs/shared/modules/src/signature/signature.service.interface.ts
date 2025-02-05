import { Transaction } from 'sequelize'
import { CreateSignature, GetSignature } from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

export interface ISignatureService {
  createSignature(
    caseId: string,
    body: CreateSignature,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetSignature>>

  // createCaseSignature(
  //   body: CreateSignatureBody,
  //   transaction?: Transaction,
  // ): Promise<ResultWrapper<{ id: string }>>

  // getSignature(id: string): Promise<ResultWrapper<GetSignatureResponse>>
  // getSignatures(
  //   params?: DefaultSearchParams,
  // ): Promise<ResultWrapper<GetSignaturesResponse>>
  // getSignatureForInvolvedParty(
  //   involvedPartyId: string,
  //   params?: DefaultSearchParams,
  //   mostRecent?: boolean,
  //   transaction?: Transaction,
  // ): Promise<ResultWrapper<GetSignaturesResponse>>
  // getSignaturesByCaseId(
  //   caseId: string,
  //   params?: DefaultSearchParams,
  //   transaction?: Transaction,
  // ): Promise<ResultWrapper<GetSignaturesResponse>>
  // getSignaturesByAdvertId(
  //   advertId: string,
  //   params?: DefaultSearchParams,
  // ): Promise<ResultWrapper<GetSignaturesResponse>>
  // updateSignature(
  //   id: string,
  //   body: UpdateSignatureBody,
  //   transaction?: Transaction,
  // ): Promise<ResultWrapper>
  // deleteSignature(
  //   signatureId: string,
  //   transaction?: Transaction,
  // ): Promise<ResultWrapper>

  // addSignatureMember(
  //   signatureId: string,
  //   transaction?: Transaction,
  // ): Promise<ResultWrapper>

  // removeSignatureMember(
  //   signatureId: string,
  //   memberId: string,
  //   transaction?: Transaction,
  // ): Promise<ResultWrapper>

  // updateSignatureMember(
  //   signatureId: string,
  //   memberId: string,
  //   body: UpdateSignatureMember,
  //   transaction?: Transaction,
  // ): Promise<ResultWrapper>
}

export const ISignatureService = Symbol('ISignatureService')
