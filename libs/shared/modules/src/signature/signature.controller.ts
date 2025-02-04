import { Route, TimeLog } from '@dmr.is/decorators'
import { UUIDValidationPipe } from '@dmr.is/pipelines'
import {
  DefaultSearchParams,
  GetSignatureResponse,
  GetSignaturesResponse,
  UpdateSignatureBody,
  UpdateSignatureMember,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

import {
  Body,
  Controller,
  Delete,
  Inject,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common'
import {
  ApiBody,
  ApiNoContentResponse,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger'

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
    operationId: 'getSignaturesForInvolvedParty',
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
    operationId: 'getSignaturesByCaseId',
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
    operationId: 'getSignaturesByAdvertId',
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
    operationId: 'getSignatureById',
    params: [{ name: 'id', type: String, required: true }],
    responseType: GetSignatureResponse,
  })
  async getSignatureById(@Param('id', new UUIDValidationPipe()) id: string) {
    return ResultWrapper.unwrap(await this.signatureService.getSignature(id))
  }

  @Route({
    path: ':id',
    operationId: 'deleteSignature',
    method: 'delete',
    params: [{ name: 'id', type: String, required: true }],
  })
  async deleteSignature(@Param('id', new UUIDValidationPipe()) id: string) {
    ResultWrapper.unwrap(await this.signatureService.deleteSignature(id))
  }

  @Route({
    path: ':id',
    operationId: 'updateSignature',
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
    operationId: 'getSignatures',
    query: [{ name: 'id', type: DefaultSearchParams, required: true }],
  })
  async getSignatures(@Query() params?: DefaultSearchParams) {
    return ResultWrapper.unwrap(
      await this.signatureService.getSignatures(params),
    )
  }

  @Put(':signatureId/members/:memberId')
  @ApiOperation({ operationId: 'updateSignatureMemeber' })
  @ApiParam({ name: 'signatureId', type: String, required: true })
  @ApiParam({ name: 'memberId', type: String, required: true })
  @ApiBody({ type: UpdateSignatureMember })
  @ApiNoContentResponse({ status: 204 })
  @TimeLog()
  async updateSignatureMember(
    @Param('signatureId', new UUIDValidationPipe()) signatureId: string,
    @Param('memberId', new UUIDValidationPipe()) memberId: string,
    @Body() body: UpdateSignatureMember,
  ) {
    ResultWrapper.unwrap(
      await this.signatureService.updateSignatureMember(
        signatureId,
        memberId,
        body,
      ),
    )
  }

  @Post(':signatureId/members')
  @ApiOperation({ operationId: 'addMemberToSignature' })
  @ApiParam({ name: 'signatureId', type: String, required: true })
  @ApiNoContentResponse({ status: 204 })
  @TimeLog()
  async addMemberToSignature(
    @Param('signatureId', new UUIDValidationPipe()) signatureId: string,
  ) {
    ResultWrapper.unwrap(
      await this.signatureService.addSignatureMember(signatureId),
    )
  }

  @Delete(':signatureId/members/:memberId')
  @ApiOperation({ operationId: 'removeMemberFromSignature' })
  @ApiParam({ name: 'signatureId', type: String, required: true })
  @ApiParam({ name: 'memberId', type: String, required: true })
  @ApiNoContentResponse({ status: 204 })
  @TimeLog()
  async removeMemberFromSignature(
    @Param('signatureId', new UUIDValidationPipe()) signatureId: string,
    @Param('memberId', new UUIDValidationPipe()) memberId: string,
  ) {
    ResultWrapper.unwrap(
      await this.signatureService.removeSignatureMember(signatureId, memberId),
    )
  }
}
