import {
  Body,
  Controller,
  Inject,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiParam } from '@nestjs/swagger'

import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { AdminAccess, LGResponse } from '../../../core/decorators'
import { AuthorizationGuard } from '../../../core/guards'
import { SignatureDto } from '../../../models/signature.model'
import { CreateSignatureDto, UpdateSignatureDto } from './dto/signature.dto'
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
