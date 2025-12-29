import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'

import { DMRUser } from '@dmr.is/auth/dmrUser'
import { CurrentUser } from '@dmr.is/decorators'
import {
  ApplicationWebScopes,
  TokenJwtAuthGuard,
} from '@dmr.is/modules/guards/auth'

import { LGResponse } from '../../../core/decorators/lg-response.decorator'
import { AuthorizationGuard } from '../../../core/guards/authorization.guard'
import {
  CreateDivisionEndingDto,
  CreateDivisionMeetingDto,
  GetMinDateResponseDto,
} from '../../../models/application.model'
import { IRecallApplicationService } from './recall-application.service.interface'

@ApiBearerAuth()
@ApplicationWebScopes()
@UseGuards(TokenJwtAuthGuard, AuthorizationGuard)
@Controller({
  path: 'applications/recall',
  version: '1',
})
export class RecallApplicationController {
  constructor(
    @Inject(IRecallApplicationService)
    private readonly applicationService: IRecallApplicationService,
  ) {}

  @Post(':applicationId/addDivisionMeeting')
  @LGResponse({ operationId: 'addDivisionMeeting' })
  async addDivisionMeeting(
    @Param('applicationId') applicationId: string,
    @Body() body: CreateDivisionMeetingDto,
    @CurrentUser() user: DMRUser,
  ): Promise<void> {
    return this.applicationService.addDivisionMeeting(applicationId, body, user)
  }

  @Post(':applicationId/addDivisionEnding')
  @LGResponse({ operationId: 'addDivisionEnding' })
  async addDivisionEnding(
    @Param('applicationId') applicationId: string,
    @Body() body: CreateDivisionEndingDto,
    @CurrentUser() user: DMRUser,
  ): Promise<void> {
    return this.applicationService.addDivisionEnding(applicationId, body, user)
  }

  @Get(':applicationId/divisionMeeting/minDate')
  @LGResponse({
    operationId: 'getMinDateForDivisionMeeting',
    type: GetMinDateResponseDto,
  })
  async getMinDateForDivisionMeeting(
    @Param('applicationId') applicationId: string,
  ): Promise<GetMinDateResponseDto> {
    return this.applicationService.getMinDateForDivisionMeeting(applicationId)
  }

  @Get(':applicationId/divisionEnding/minDate')
  @LGResponse({
    operationId: 'getMinDateForDivisionEnding',
    type: GetMinDateResponseDto,
  })
  async getMinDateForDivisionEnding(
    @Param('applicationId') applicationId: string,
  ): Promise<GetMinDateResponseDto> {
    return this.applicationService.getMinDateForDivisionEnding(applicationId)
  }
}
