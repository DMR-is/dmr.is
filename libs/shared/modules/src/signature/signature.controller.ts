import { TimeLog } from '@dmr.is/decorators'
import { EnumValidationPipe, UUIDValidationPipe } from '@dmr.is/pipelines'
import {
  CreateSignature,
  GetSignature,
  UpdateSignatureMember,
  UpdateSignatureRecord,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
} from '@nestjs/common'
import {
  ApiBody,
  ApiNoContentResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger'

import { MemberTypeEnum } from './lib/types'
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

  @Put(':signatureId/records/:recordId/members/:memberId')
  @ApiOperation({ operationId: 'updateSignatureMember' })
  @ApiParam({ name: 'signatureId', type: String, required: true })
  @ApiParam({ name: 'recordId', type: String, required: true })
  @ApiParam({ name: 'memberId', type: String, required: true })
  @ApiBody({ type: UpdateSignatureMember })
  @ApiNoContentResponse()
  @TimeLog()
  async updateSignatureMember(
    @Param('signatureId', new UUIDValidationPipe()) signatureId: string,
    @Param('recordId', new UUIDValidationPipe()) recordId: string,
    @Param('memberId', new UUIDValidationPipe()) memberId: string,
    @Body() body: UpdateSignatureMember,
  ): Promise<void> {
    ResultWrapper.unwrap(
      await this.signatureService.updateSignatureMember(
        signatureId,
        recordId,
        memberId,
        body,
      ),
    )
  }

  @Delete(':signatureId/records/:recordId/members/:memberId')
  @ApiOperation({ operationId: 'deleteSignatureMember' })
  @ApiParam({ name: 'signatureId', type: String, required: true })
  @ApiParam({ name: 'recordId', type: String, required: true })
  @ApiParam({ name: 'memberId', type: String, required: true })
  @ApiNoContentResponse()
  @TimeLog()
  async deleteSignatureMember(
    @Param('signatureId', new UUIDValidationPipe()) signatureId: string,
    @Param('recordId', new UUIDValidationPipe()) recordId: string,
    @Param('memberId', new UUIDValidationPipe()) memberId: string,
  ): Promise<void> {
    ResultWrapper.unwrap(
      await this.signatureService.deleteSignatureMember(
        signatureId,
        recordId,
        memberId,
      ),
    )
  }

  @Post(':signatureId/records/:recordId/members/:memberType')
  @ApiOperation({ operationId: 'createSignatureMember' })
  @ApiParam({ name: 'signatureId', type: String, required: true })
  @ApiParam({ name: 'recordId', type: String, required: true })
  @ApiParam({ name: 'memberType', enum: MemberTypeEnum, required: true })
  @ApiNoContentResponse()
  @TimeLog()
  async createSignatureMember(
    @Param('signatureId', new UUIDValidationPipe()) signatureId: string,
    @Param('recordId', new UUIDValidationPipe()) recordId: string,
    @Param('memberType', new EnumValidationPipe(MemberTypeEnum))
    memberType: MemberTypeEnum,
  ): Promise<void> {
    ResultWrapper.unwrap(
      await this.signatureService.createSignatureMember(
        signatureId,
        recordId,
        memberType,
      ),
    )
  }

  @Put(':signatureId/records/:recordId')
  @ApiOperation({ operationId: 'updateSignatureRecord' })
  @ApiParam({ name: 'signatureId', type: String, required: true })
  @ApiParam({ name: 'recordId', type: String, required: true })
  @ApiBody({ type: UpdateSignatureRecord })
  @ApiNoContentResponse()
  @TimeLog()
  async updateSignatureRecord(
    @Param('signatureId', new UUIDValidationPipe()) signatureId: string,
    @Param('recordId', new UUIDValidationPipe()) recordId: string,
    @Body() body: UpdateSignatureRecord,
  ): Promise<void> {
    ResultWrapper.unwrap(
      await this.signatureService.updateSignatureRecord(
        signatureId,
        recordId,
        body,
      ),
    )
  }

  @Delete(':signatureId/records/:recordId')
  @ApiOperation({ operationId: 'deleteSignatureRecord' })
  @ApiParam({ name: 'signatureId', type: String, required: true })
  @ApiParam({ name: 'recordId', type: String, required: true })
  @ApiNoContentResponse()
  @TimeLog()
  async deleteSignatureRecord(
    @Param('signatureId', new UUIDValidationPipe()) signatureId: string,
    @Param('recordId', new UUIDValidationPipe()) recordId: string,
  ): Promise<void> {
    ResultWrapper.unwrap(
      await this.signatureService.deleteSignatureRecord(signatureId, recordId),
    )
  }

  @Post(':signatureId/records')
  @ApiOperation({ operationId: 'createSignatureRecord' })
  @ApiParam({ name: 'signatureId', type: String, required: true })
  @ApiNoContentResponse()
  @TimeLog()
  async createSignatureRecord(
    @Param('signatureId', new UUIDValidationPipe()) signatureId: string,
  ): Promise<void> {
    ResultWrapper.unwrap(
      await this.signatureService.createSignatureRecord(signatureId),
    )
  }

  @Post(':caseId')
  @ApiOperation({ operationId: 'createSignature' })
  @ApiParam({ name: 'caseId', type: String, required: true })
  @ApiBody({ type: CreateSignature, required: true })
  @ApiNoContentResponse()
  @TimeLog()
  async createSignature(
    @Param('caseId') caseId: string,
    @Body() body: CreateSignature,
  ): Promise<void> {
    ResultWrapper.unwrap(
      await this.signatureService.createSignature(caseId, body),
    )
  }

  @Get('signatures/:caseId')
  @ApiOperation({ operationId: 'getSignatureByCaseId' })
  @ApiParam({ name: 'caseId', type: String, required: true })
  @ApiResponse({ type: GetSignature })
  @TimeLog()
  async getSignatureByCaseId(
    @Param('caseId', new UUIDValidationPipe()) caseId: string,
  ): Promise<GetSignature> {
    return ResultWrapper.unwrap(
      await this.signatureService.getSignatureByCaseId(caseId),
    )
  }

  @Get(':signatureId')
  @ApiOperation({ operationId: 'getSignature' })
  @ApiParam({ name: 'signatureId', type: String, required: true })
  @ApiResponse({ type: GetSignature })
  @TimeLog()
  async getSignature(
    @Param('signatureId', new UUIDValidationPipe()) signatureId: string,
  ): Promise<GetSignature> {
    return ResultWrapper.unwrap(
      await this.signatureService.getSignature(signatureId),
    )
  }

  // @Route({
  //   path: 'involved-party/:id',
  //   operationId: 'getSignaturesForInvolvedParty',
  //   params: [{ name: 'id', type: String, required: true }],
  //   query: [{ name: 'id', type: DefaultSearchParams, required: true }],
  //   responseType: GetSignaturesResponse,
  // })
  // async getSignaturesForInvolvedParty(
  //   @Param('id', new UUIDValidationPipe()) involvedPartyId: string,
  //   @Query() params?: DefaultSearchParams,
  // ) {
  //   return ResultWrapper.unwrap(
  //     await this.signatureService.getSignatureForInvolvedParty(
  //       involvedPartyId,
  //       params,
  //     ),
  //   )
  // }

  // @Route({
  //   path: 'case/:id',
  //   operationId: 'getSignaturesByCaseId',
  //   params: [{ name: 'id', type: String, required: true }],
  //   query: [{ name: 'id', type: DefaultSearchParams, required: true }],
  //   responseType: GetSignaturesResponse,
  // })
  // async getSignaturesByCaseId(
  //   @Param('id', new UUIDValidationPipe()) caseId: string,
  //   @Query() params?: DefaultSearchParams,
  // ) {
  //   return ResultWrapper.unwrap(
  //     await this.signatureService.getSignaturesByCaseId(caseId, params),
  //   )
  // }

  // @Route({
  //   path: 'advert/:id',
  //   operationId: 'getSignaturesByAdvertId',
  //   params: [{ name: 'id', type: String, required: true }],
  //   query: [{ name: 'id', type: DefaultSearchParams, required: true }],
  //   responseType: GetSignaturesResponse,
  // })
  // async getSignaturesByAdvertId(
  //   @Param('id', new UUIDValidationPipe()) advertId: string,
  //   @Query() params?: DefaultSearchParams,
  // ) {
  //   return ResultWrapper.unwrap(
  //     await this.signatureService.getSignaturesByAdvertId(advertId, params),
  //   )
  // }

  // @Route({
  //   path: ':id',
  //   operationId: 'getSignatureById',
  //   params: [{ name: 'id', type: String, required: true }],
  //   responseType: GetSignatureResponse,
  // })
  // async getSignatureById(@Param('id', new UUIDValidationPipe()) id: string) {
  //   return ResultWrapper.unwrap(await this.signatureService.getSignature(id))
  // }

  // @Route({
  //   path: ':id',
  //   operationId: 'deleteSignature',
  //   method: 'delete',
  //   params: [{ name: 'id', type: String, required: true }],
  // })
  // async deleteSignature(@Param('id', new UUIDValidationPipe()) id: string) {
  //   ResultWrapper.unwrap(await this.signatureService.deleteSignature(id))
  // }

  // @Route({
  //   path: ':id',
  //   operationId: 'updateSignature',
  //   method: 'put',
  //   params: [{ name: 'id', type: String, required: true }],
  //   bodyType: UpdateSignatureBody,
  // })
  // async updateSignature(
  //   @Param('id', new UUIDValidationPipe()) id: string,
  //   @Body() body: UpdateSignatureBody,
  // ) {
  //   ResultWrapper.unwrap(await this.signatureService.updateSignature(id, body))
  // }

  // @Route({
  //   path: '',
  //   operationId: 'getSignatures',
  //   query: [{ name: 'id', type: DefaultSearchParams, required: true }],
  // })
  // async getSignatures(@Query() params?: DefaultSearchParams) {
  //   return ResultWrapper.unwrap(
  //     await this.signatureService.getSignatures(params),
  //   )
  // }

  // @Put(':signatureId/members/:memberId')
  // @ApiOperation({ operationId: 'updateSignatureMemeber' })
  // @ApiParam({ name: 'signatureId', type: String, required: true })
  // @ApiParam({ name: 'memberId', type: String, required: true })
  // @ApiBody({ type: UpdateSignatureMember })
  // @ApiNoContentResponse({ status: 204 })
  // @TimeLog()
  // async updateSignatureMember(
  //   @Param('signatureId', new UUIDValidationPipe()) signatureId: string,
  //   @Param('memberId', new UUIDValidationPipe()) memberId: string,
  //   @Body() body: UpdateSignatureMember,
  // ) {
  //   ResultWrapper.unwrap(
  //     await this.signatureService.updateSignatureMember(
  //       signatureId,
  //       memberId,
  //       body,
  //     ),
  //   )
  // }

  // @Post(':signatureId/members')
  // @ApiOperation({ operationId: 'addMemberToSignature' })
  // @ApiParam({ name: 'signatureId', type: String, required: true })
  // @ApiNoContentResponse({ status: 204 })
  // @TimeLog()
  // async addMemberToSignature(
  //   @Param('signatureId', new UUIDValidationPipe()) signatureId: string,
  // ) {
  //   ResultWrapper.unwrap(
  //     await this.signatureService.addSignatureMember(signatureId),
  //   )
  // }

  // @Delete(':signatureId/members/:memberId')
  // @ApiOperation({ operationId: 'removeMemberFromSignature' })
  // @ApiParam({ name: 'signatureId', type: String, required: true })
  // @ApiParam({ name: 'memberId', type: String, required: true })
  // @ApiNoContentResponse({ status: 204 })
  // @TimeLog()
  // async removeMemberFromSignature(
  //   @Param('signatureId', new UUIDValidationPipe()) signatureId: string,
  //   @Param('memberId', new UUIDValidationPipe()) memberId: string,
  // ) {
  //   ResultWrapper.unwrap(
  //     await this.signatureService.removeSignatureMember(signatureId, memberId),
  //   )
  // }
}
