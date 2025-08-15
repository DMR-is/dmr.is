import {
  Body,
  Controller,
  Delete,
  Inject,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'

import { DMRUser } from '@dmr.is/auth/dmrUser'
import { CurrentUser } from '@dmr.is/decorators'
import { TokenJwtAuthGuard } from '@dmr.is/modules'

import { LGResponse } from '../../../../decorators/lg-response.decorator'
import { IslandIsSubmitCommonApplicationDto } from './dto/island-is-application.dto'
import { IslandIsCommonApplicationService } from './island-is-application.service'
import { IIslandIsCommonApplicationService } from './island-is-application.service.interface'

@Controller({
  path: 'applications/common/island-is',
  version: '1',
})
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard)
export class CommonApplicationController {
  constructor(
    @Inject(IIslandIsCommonApplicationService)
    private readonly applicationService: IslandIsCommonApplicationService,
  ) {}

  @Post()
  @Post('submitIslandIsApplication')
  @LGResponse({ operationId: 'submitIslandIsApplication', status: 201 })
  async submitApplication(
    @Body() body: IslandIsSubmitCommonApplicationDto,
    @CurrentUser() user: DMRUser,
  ): Promise<void> {
    return this.applicationService.submitApplication(body, user)
  }

  @Delete(':id')
  @LGResponse({ operationId: 'deleteIslandIsApplication' })
  async deleteIslandIsApplication(
    @Param('id') id: string,
    @CurrentUser() user: DMRUser,
  ): Promise<void> {
    await this.applicationService.deleteApplication(id, user)
  }
}
