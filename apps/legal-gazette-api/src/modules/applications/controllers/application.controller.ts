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
import { CurrentUser } from '@dmr.is/decorators'
import { TokenJwtAuthGuard } from '@dmr.is/modules'
import { EnumValidationPipe } from '@dmr.is/pipelines'
import { PagingQuery } from '@dmr.is/shared/dto'

import { LGResponse } from '../../../decorators/lg-response.decorator'
import { CaseDto } from '../../case/dto/case.dto'
import { ApplicationTypeEnum } from '../application.model'
import { IApplicationService } from '../application.service.interface'
import {
  AddDivisionMeetingForApplicationDto,
  ApplicationDetailedDto,
  ApplicationsDto,
  UpdateApplicationDto,
} from '../dto/application.dto'

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
  @ApiParam({ enum: ApplicationTypeEnum, name: 'applicationType' })
  @LGResponse({ operationId: 'createApplication', type: CaseDto })
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
  async addDivisionMeetingAdvert(
    @Param('applicationId') applicationId: string,
    @Body() body: AddDivisionMeetingForApplicationDto,
    @CurrentUser() user: DMRUser,
  ): Promise<void> {
    return this.applicationService.addDivisionMeetingAdvertToApplication(
      applicationId,
      body,
      user,
    )
  }

  @Post(':applicationId/addDivisionEndingAdvertToApplication')
  @LGResponse({ operationId: 'addDivisionEndingAdvertToApplication' })
  async addDivisionEndingAdvertToApplication(
    @Param('applicationId') applicationId: string,
    @CurrentUser() user: DMRUser,
  ): Promise<void> {
    return this.applicationService.addDivisionEndingAdvertToApplication(
      applicationId,
      user,
    )
  }

  @Post(':applicationId/addRecallAdvertToApplication')
  @LGResponse({ operationId: 'addRecallAdvertToApplication' })
  async addRecallAdvertToApplication(
    @Param('applicationId') applicationId: string,
    @CurrentUser() user: DMRUser,
  ): Promise<void> {
    return this.applicationService.addRecallAdvertToApplication(
      applicationId,
      user,
    )
  }

  @Post(':applicationId/addCommonAdvertToApplication')
  @LGResponse({ operationId: 'addCommonAdvertToApplication' })
  async addCommonAdvertToApplication(
    @Param('applicationId') applicationId: string,
    @CurrentUser() user: DMRUser,
  ): Promise<void> {
    return this.applicationService.addCommonAdvertToApplication(
      applicationId,
      user,
    )
  }
}
