import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common'
import { ApiBearerAuth, ApiParam } from '@nestjs/swagger'

import { DMRUser } from '@dmr.is/auth/dmrUser'
import { CurrentUser } from '@dmr.is/decorators'
import { ApplicationTypeEnum } from '@dmr.is/legal-gazette/schemas'
import {
  ApplicationWebScopes,
  TokenJwtAuthGuard,
} from '@dmr.is/modules/guards/auth'
import { EnumValidationPipe } from '@dmr.is/pipelines'
import { PagingQuery } from '@dmr.is/shared/dto'

import { LGResponse } from '../../core/decorators/lg-response.decorator'
import { AuthorizationGuard } from '../../core/guards/authorization.guard'
import {
  ApplicationDetailedDto,
  ApplicationDto,
  GetApplicationsDto,
  UpdateApplicationDto,
} from '../../models/application.model'
import { IApplicationService } from './application.service.interface'

@ApiBearerAuth()
@ApplicationWebScopes()
@UseGuards(TokenJwtAuthGuard, AuthorizationGuard)
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
  @ApiParam({
    name: 'applicationType',
    enum: ApplicationTypeEnum,
    required: true,
  })
  @LGResponse({ operationId: 'createApplication', type: ApplicationDto })
  async createApplication(
    @Param('applicationType', new EnumValidationPipe(ApplicationTypeEnum))
    applicationType: ApplicationTypeEnum,
    @CurrentUser() user: DMRUser,
  ): Promise<ApplicationDto> {
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
  @LGResponse({ operationId: 'getMyApplications', type: GetApplicationsDto })
  async getMyApplications(
    @Query() query: PagingQuery,
    @CurrentUser() user: DMRUser,
  ): Promise<GetApplicationsDto> {
    return this.applicationService.getMyApplications(query, user)
  }

  @Get('getApplicationById/:applicationId')
  @LGResponse({
    operationId: 'getApplicationById',
    type: ApplicationDetailedDto,
  })
  async getApplicationById(
    @Param('applicationId') applicationId: string,
    @CurrentUser() user: DMRUser,
  ): Promise<ApplicationDetailedDto> {
    return this.applicationService.getApplicationById(applicationId, user)
  }

  @Get('getApplicationByCaseId/:caseId')
  @LGResponse({
    operationId: 'getApplicationByCaseId',
    type: ApplicationDetailedDto,
  })
  async getApplicationByCaseId(
    @Param('caseId') caseId: string,
    @CurrentUser() user: DMRUser,
  ): Promise<ApplicationDetailedDto> {
    return this.applicationService.getApplicationByCaseId(caseId, user)
  }

  @Patch(':applicationId')
  @LGResponse({
    operationId: 'updateApplication',
    type: ApplicationDetailedDto,
  })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: false }))
  async updateApplication(
    @Param('applicationId') applicationId: string,
    @Body() body: UpdateApplicationDto,
    @CurrentUser() user: DMRUser,
  ): Promise<ApplicationDetailedDto> {
    return this.applicationService.updateApplication(applicationId, body, user)
  }
}
