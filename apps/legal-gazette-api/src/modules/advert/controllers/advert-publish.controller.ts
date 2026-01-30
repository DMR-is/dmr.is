import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiParam } from '@nestjs/swagger'

import { DMRUser } from '@dmr.is/auth/dmrUser'
import { CurrentUser } from '@dmr.is/decorators'
import { TokenJwtAuthGuard } from '@dmr.is/modules/guards/auth'
import { UUIDValidationPipe } from '@dmr.is/pipelines'

import { AdminAccess } from '../../../core/decorators/admin.decorator'
import { LGResponse } from '../../../core/decorators/lg-response.decorator'
import { AuthorizationGuard } from '../../../core/guards/authorization.guard'
import { PublishAdvertsBody } from '../../../models/advert.model'

@Controller({
  path: 'adverts',
  version: '1',
})
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, AuthorizationGuard)
@AdminAccess()
export class AdvertPublishController {
  @Post('publish')
  @LGResponse({ operationId: 'publishAdverts' })
  async publishAdverts(
    @Body() body: PublishAdvertsBody,
    @CurrentUser() currentUser: DMRUser,
  ) {
    throw new Error('Method not implemented.')
  }

  @Post(':id/publish')
  @ApiParam({ name: 'id', type: String })
  @LGResponse({ operationId: 'publishAdvert' })
  async publishAdvert(
    @Param('id', new UUIDValidationPipe()) id: string,
    @CurrentUser() currentUser: DMRUser,
  ) {
    throw new Error('Method not implemented.')
  }
}
