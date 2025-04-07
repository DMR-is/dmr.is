import { Transaction } from 'sequelize'
import {
  CreateSignature,
  GetSignature,
  UpdateSignatureMember,
  UpdateSignatureRecord,
} from '@dmr.is/official-journal/dto/signature/signature.dto'
import { ResultWrapper } from '@dmr.is/types'

import { MemberTypeEnum } from './types'

export interface ISignatureService {
  createSignature(
    caseId: string,
    body: CreateSignature,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetSignature>>

  updateSignatureRecord(
    signatureId: string,
    recordId: string,
    body: UpdateSignatureRecord,
    transaction?: Transaction,
  ): Promise<ResultWrapper>

  updateSignatureMember(
    signatureId: string,
    recordId: string,
    memberId: string,
    body: UpdateSignatureMember,
    transaction?: Transaction,
  ): Promise<ResultWrapper>

  getSignatureForInvolvedParty(
    involvedPartyId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetSignature>>

  getSignature(
    signatureId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetSignature>>

  getSignatureByCaseId(
    caseId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetSignature>>

  createSignatureMember(
    signatureId: string,
    recordId: string,
    memberType: MemberTypeEnum,
  ): Promise<ResultWrapper>

  deleteSignatureMember(
    signatureId: string,
    recordId: string,
    memberId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper>

  createSignatureRecord(
    signatureId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper>

  deleteSignatureRecord(
    signatureId: string,
    recordId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper>

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
