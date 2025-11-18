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
} from '@nestjs/common'
import { ApiBearerAuth, ApiParam } from '@nestjs/swagger'

import { DMRUser } from '@dmr.is/auth/dmrUser'
import { PersonDto } from '@dmr.is/clients/national-registry'
import { CurrentUser } from '@dmr.is/decorators'
import { Scopes, ScopesGuard, TokenJwtAuthGuard } from '@dmr.is/modules'
import { EnumValidationPipe } from '@dmr.is/pipelines'
import { PagingQuery } from '@dmr.is/shared/dto'

import { CurrentSubmittee } from '../../core/decorators/current-submittee.decorator'
import { LGResponse } from '../../core/decorators/lg-response.decorator'
import { CurrentNationalRegistryPersonGuard } from '../../core/guards/current-submitte.guard'
import {
  AddDivisionEndingForApplicationDto,
  AddDivisionMeetingForApplicationDto,
  ApplicationDetailedDto,
  ApplicationDto,
  ApplicationTypeEnum,
  GetApplicationsDto,
  UpdateApplicationDto,
} from '../../models/application.model'
import { IApplicationService } from './application.service.interface'

@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, ScopesGuard)
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
  @ApiParam({ enum: ApplicationTypeEnum, name: 'applicationType' })
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

  @UseGuards(ScopesGuard)
  @Scopes('@dmr.is/lg-application-web')
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
  async updateApplication(
    @Param('applicationId') applicationId: string,
    @Body() body: UpdateApplicationDto,
    @CurrentUser() user: DMRUser,
  ): Promise<ApplicationDetailedDto> {
    return this.applicationService.updateApplication(applicationId, body, user)
  }

  @Post(':applicationId/addDivisionMeetingAdvertToApplication')
  @LGResponse({ operationId: 'addDivisionMeetingAdvertToApplication' })
  @UseGuards(CurrentNationalRegistryPersonGuard)
  async addDivisionMeetingAdvert(
    @Param('applicationId') applicationId: string,
    @Body() body: AddDivisionMeetingForApplicationDto,
    @CurrentSubmittee() submittee: PersonDto,
  ): Promise<void> {
    return this.applicationService.addDivisionMeetingAdvertToApplication(
      applicationId,
      body,
      submittee,
    )
  }

  @Post(':applicationId/addDivisionEndingAdvertToApplication')
  @LGResponse({ operationId: 'addDivisionEndingAdvertToApplication' })
  @UseGuards(CurrentNationalRegistryPersonGuard)
  async addDivisionEndingAdvertToApplication(
    @Param('applicationId') applicationId: string,
    @Body() body: AddDivisionEndingForApplicationDto,
    @CurrentSubmittee() submittee: PersonDto,
  ): Promise<void> {
    return this.applicationService.addDivisionEndingAdvertToApplication(
      applicationId,
      body,
      submittee,
    )
  }
}
