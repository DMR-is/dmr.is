import { Controller, Inject, Param, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger'

import { type DMRUser } from '@dmr.is/auth/dmrUser'
import { CurrentUser } from '@dmr.is/decorators'
import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { AdminAccess } from '../../core/decorators/admin.decorator'
import { LGResponse } from '../../core/decorators/lg-response.decorator'
import { AuthorizationGuard } from '../../core/guards/authorization.guard'
import { RegeneratePdfResponseDto } from './pdf-admin.dto'
import { IPdfAdminService } from './pdf-admin.service.interface'

@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, AuthorizationGuard)
@AdminAccess()
@ApiTags('PDF Admin')
@Controller({
  path: 'pdf-admin',
  version: '1',
})
export class PdfAdminController {
  constructor(
    @Inject(IPdfAdminService)
    private readonly pdfAdminService: IPdfAdminService,
  ) {}

  @Post(':advertId/publications/:publicationId/regenerate')
  @LGResponse({
    operationId: 'regeneratePublicationPdf',
    type: RegeneratePdfResponseDto,
    description: 'Regenerates the PDF for a specific publication',
  })
  @ApiParam({
    name: 'advertId',
    description: 'The UUID of the advert',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiParam({
    name: 'publicationId',
    description: 'The UUID of the publication',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  regeneratePdf(
    @Param('advertId') advertId: string,
    @Param('publicationId') publicationId: string,
    @CurrentUser() user: DMRUser,
  ): Promise<RegeneratePdfResponseDto> {
    return this.pdfAdminService.regeneratePdf(advertId, publicationId, user)
  }
}
