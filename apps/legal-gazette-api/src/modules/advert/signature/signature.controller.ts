import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiParam } from '@nestjs/swagger'

import { TokenJwtAuthGuard } from '@dmr.is/shared/modules'

import { AdminAccess, LGResponse } from '../../../core/decorators'
import { AuthorizationGuard } from '../../../core/guards'
import {
  CreateSignatureDto,
  SignatureDto,
  UpdateSignatureDto,
} from '../../../models/signature.model'
import { ISignatureService } from './signature.service.interface'

@Controller({
  version: '1',
  path: 'adverts',
})
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, AuthorizationGuard)
@AdminAccess()
export class SignatureController {
  constructor(
    @Inject(ISignatureService)
    private readonly signatureService: ISignatureService,
  ) {}

  @Get('/signatures/:signatureId')
  @LGResponse({ operationId: 'getSignatureById', type: SignatureDto })
  async getSignatureById(
    @Param('signatureId') signatureId: string,
  ): Promise<SignatureDto> {
    return this.signatureService.getSignatureById(signatureId)
  }

  @Get('/:advertId/signatures')
  @ApiParam({ name: 'advertId', required: true })
  @LGResponse({ operationId: 'getAdvertSignature', type: SignatureDto })
  async getAdvertSignature(
    @Param('advertId') advertId: string,
  ): Promise<SignatureDto> {
    return this.signatureService.getAdvertSignature(advertId)
  }

  @Post('/:advertId/signatures')
  @ApiParam({ name: 'advertId', required: true })
  @LGResponse({ operationId: 'createSignature', type: SignatureDto })
  async createSignature(
    @Param('advertId') advertId: string,
    @Body() body: CreateSignatureDto,
  ): Promise<SignatureDto> {
    return this.signatureService.createSignature(advertId, body)
  }

  @Patch('/:advertId/signatures/:signatureId')
  @ApiParam({ name: 'advertId', required: true })
  @LGResponse({ operationId: 'updateSignature', type: SignatureDto })
  async updateSignature(
    @Param('advertId') advertId: string,
    @Param('signatureId') signatureId: string,
    @Body() body: UpdateSignatureDto,
  ): Promise<SignatureDto> {
    return this.signatureService.updateSignature(signatureId, advertId, body)
  }
}
