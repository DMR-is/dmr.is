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

import { TokenJwtAuthGuard } from '@dmr.is/modules'

import { LGResponse } from '../../../decorators/lg-response.decorator'
import { SubmitCommonApplicationDto } from './dto/common-application.dto'
import { ICommonApplicationService } from './common-application.service.interface'

@Controller({
  path: 'common-applications',
  version: '1',
})
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard)
export class CommonApplicationController {
  constructor(
    @Inject(ICommonApplicationService)
    private readonly applicationService: ICommonApplicationService,
  ) {}

  @Post()
  @LGResponse({ operationId: 'submitApplication', status: 201 })
  async submitApplication(
    @Body() body: SubmitCommonApplicationDto,
  ): Promise<void> {
    return this.applicationService.submitApplication(body)
  }

  @Delete(':id')
  @LGResponse({ operationId: 'deleteCommonApplication' })
  async deleteApplication(@Param('id') id: string): Promise<void> {
    await this.applicationService.deleteApplication(id)
  }
}
