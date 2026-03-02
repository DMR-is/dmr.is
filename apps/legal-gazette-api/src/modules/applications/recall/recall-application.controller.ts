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

import { CurrentUser } from '@dmr.is/decorators'
import { type DMRUser } from '@dmr.is/island-auth-nest/dmrUser'
import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { LGResponse } from '../../../core/decorators/lg-response.decorator'
import { AuthorizationGuard } from '../../../core/guards/authorization.guard'
import { OwnershipGuard } from '../../../core/guards/ownership.guard'
import { ApplicationWebScopes } from '../../../core/guards/scope-guards/scopes.decorator'
import {
  CreateDivisionEndingDto,
  CreateDivisionMeetingDto,
  GetMinDateResponseDto,
} from '../dto/application-extra.dto'
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
  @UseGuards(OwnershipGuard)
  async addDivisionMeeting(
    @Param('applicationId') applicationId: string,
    @Body() body: CreateDivisionMeetingDto,
    @CurrentUser() user: DMRUser,
  ): Promise<void> {
    return this.applicationService.addDivisionMeeting(applicationId, body, user)
  }

  @Post(':applicationId/addDivisionEnding')
  @LGResponse({ operationId: 'addDivisionEnding' })
  @UseGuards(OwnershipGuard)
  async addDivisionEnding(
    @Param('applicationId') applicationId: string,
    @Body() body: CreateDivisionEndingDto,
    @CurrentUser() user: DMRUser,
  ): Promise<void> {
    return this.applicationService.addDivisionEnding(applicationId, body, user)
  }

  @UseGuards(OwnershipGuard)
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

  @UseGuards(OwnershipGuard)
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
