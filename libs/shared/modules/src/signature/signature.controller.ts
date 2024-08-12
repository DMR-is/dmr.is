import { Route } from '@dmr.is/decorators'
import { UUIDValidationPipe } from '@dmr.is/pipelines'
import {
  DefaultSearchParams,
  GetSignatureResponse,
  GetSignaturesResponse,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

import { Controller, Inject, Param, Query } from '@nestjs/common'

import { ISignatureService } from './signature.service.interface'

@Controller({
  version: '1',
  path: 'signatures',
})
export class SignatureController {
  constructor(
    @Inject(ISignatureService)
    private readonly signatureService: ISignatureService,
  ) {}

  @Route({
    path: 'involved-party/:id',
    params: [{ name: 'id', type: String, required: true }],
    query: [{ name: 'id', type: DefaultSearchParams, required: true }],
    responseType: GetSignaturesResponse,
  })
  async getSignaturesForInvolvedParty(
    @Param('id', UUIDValidationPipe) involvedPartyId: string,
    @Query() params?: DefaultSearchParams,
  ) {
    return ResultWrapper.unwrap(
      await this.signatureService.getSignatureForInvolvedParty(
        involvedPartyId,
        params,
      ),
    )
  }

  @Route({
    path: 'case/:id',
    params: [{ name: 'id', type: String, required: true }],
    query: [{ name: 'id', type: DefaultSearchParams, required: true }],
    responseType: GetSignaturesResponse,
  })
  async getSignaturesByCaseId(
    @Param('id', UUIDValidationPipe) caseId: string,
    @Query() params?: DefaultSearchParams,
  ) {
    return ResultWrapper.unwrap(
      await this.signatureService.getSignaturesByCaseId(caseId, params),
    )
  }

  @Route({
    path: 'advert/:id',
    params: [{ name: 'id', type: String, required: true }],
    query: [{ name: 'id', type: DefaultSearchParams, required: true }],
    responseType: GetSignaturesResponse,
  })
  async getSignaturesByAdvertId(
    @Param('id', UUIDValidationPipe) advertId: string,
    @Query() params?: DefaultSearchParams,
  ) {
    return ResultWrapper.unwrap(
      await this.signatureService.getSignaturesByAdvertId(advertId, params),
    )
  }

  @Route({
    path: ':id',
    params: [{ name: 'id', type: String, required: true }],
    responseType: GetSignatureResponse,
  })
  async getSignatureById(@Param('id', UUIDValidationPipe) id: string) {
    return ResultWrapper.unwrap(await this.signatureService.getSignature(id))
  }

  @Route({
    path: '',
    query: [{ name: 'id', type: DefaultSearchParams, required: true }],
  })
  async getSignatures(@Query() params?: DefaultSearchParams) {
    return ResultWrapper.unwrap(
      await this.signatureService.getSignatures(params),
    )
  }
}
