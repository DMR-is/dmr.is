import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'

import { DMRUser } from '@dmr.is/auth/dmrUser'
import { CurrentUser } from '@dmr.is/decorators'
import { TokenJwtAuthGuard } from '@dmr.is/modules'
import { EnumValidationPipe } from '@dmr.is/pipelines'
import { PagingQuery } from '@dmr.is/shared/dto'

import { LGResponse } from '../../../decorators/lg-response.decorator'
import { CaseDto } from '../../case/dto/case.dto'
import { ApplicationTypeEnum } from '../application.model'
import { IApplicationService } from '../application.service.interface'
import { ApplicationsDto } from '../dto/application.dto'

@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard)
@Controller({
  path: 'applications',
  version: '1',
})
export class ApplicationController {
  constructor(
    @Inject(IApplicationService)
    private readonly applicationService: IApplicationService,
  ) {}

  @Post('createApplication/:applicationType')
  @LGResponse({ operationId: 'createApplication', type: ApplicationsDto })
  async createApplication(
    @Param('applicationType', new EnumValidationPipe(ApplicationTypeEnum))
    applicationType: ApplicationTypeEnum,
    @CurrentUser() user: DMRUser,
  ): Promise<CaseDto> {
    return this.applicationService.createApplication(applicationType, user)
  }

  @Post('submitApplication/:applicationId')
  @LGResponse({ operationId: 'submitApplication' })
  async submitApplication(
    @Param('applicationId') applicationId: string,
    @CurrentUser() user: DMRUser,
  ): Promise<void> {
    return this.applicationService.submitApplication(applicationId, user)
  }

  @Get('getMyApplications')
  @LGResponse({ operationId: 'getMyApplications', type: ApplicationsDto })
  async getMyApplications(
    @Query() query: PagingQuery,
    @CurrentUser() user: DMRUser,
  ): Promise<ApplicationsDto> {
    return this.applicationService.getMyApplications(query, user)
  }
}
