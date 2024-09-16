import { Route } from '@dmr.is/decorators'
import { UUIDValidationPipe } from '@dmr.is/pipelines'
import {
  DefaultSearchParams,
  GetSignatureResponse,
  GetSignaturesResponse,
  UpdateSignatureBody,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

import { Body, Controller, Inject, Param, Query } from '@nestjs/common'

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
    @Param('id', new UUIDValidationPipe()) involvedPartyId: string,
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
    @Param('id', new UUIDValidationPipe()) caseId: string,
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
    @Param('id', new UUIDValidationPipe()) advertId: string,
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
  async getSignatureById(@Param('id', new UUIDValidationPipe()) id: string) {
    return ResultWrapper.unwrap(await this.signatureService.getSignature(id))
  }

  @Route({
    path: ':id',
    method: 'delete',
    params: [{ name: 'id', type: String, required: true }],
  })
  async deleteSignature(@Param('id', new UUIDValidationPipe()) id: string) {
    ResultWrapper.unwrap(await this.signatureService.deleteSignature(id))
  }

  @Route({
    path: ':id',
    method: 'put',
    params: [{ name: 'id', type: String, required: true }],
    bodyType: UpdateSignatureBody,
  })
  async updateSignature(
    @Param('id', new UUIDValidationPipe()) id: string,
    @Body() body: UpdateSignatureBody,
  ) {
    ResultWrapper.unwrap(await this.signatureService.updateSignature(id, body))
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
