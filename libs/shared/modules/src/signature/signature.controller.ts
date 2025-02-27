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
  @ApiNoContentResponse()
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
  @ApiNoContentResponse()
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
  @ApiParam({ name: 'memberType', enum: MemberTypeEnum })
  @ApiNoContentResponse()
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
  @ApiNoContentResponse()
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
  @ApiNoContentResponse()
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
  @ApiNoContentResponse()
  async createSignatureRecord(
    @Param('signatureId', new UUIDValidationPipe()) signatureId: string,
  ): Promise<void> {
    ResultWrapper.unwrap(
      await this.signatureService.createSignatureRecord(signatureId),
    )
  }

  @Post(':caseId')
  @ApiOperation({ operationId: 'createSignature' })
  @ApiNoContentResponse()
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
  @ApiResponse({ type: GetSignature })
  async getSignatureByCaseId(
    @Param('caseId', new UUIDValidationPipe()) caseId: string,
  ): Promise<GetSignature> {
    return ResultWrapper.unwrap(
      await this.signatureService.getSignatureByCaseId(caseId),
    )
  }

  @Get(':signatureId')
  @ApiOperation({ operationId: 'getSignature' })
  @ApiResponse({ type: GetSignature })
  async getSignature(
    @Param('signatureId', new UUIDValidationPipe()) signatureId: string,
  ): Promise<GetSignature> {
    return ResultWrapper.unwrap(
      await this.signatureService.getSignature(signatureId),
    )
  }
}
