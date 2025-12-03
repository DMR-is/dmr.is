import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'

import { TokenJwtAuthGuard } from '@dmr.is/modules/guards/auth'

import { AdminAccess } from '../../../core/decorators/admin.decorator'
import { LGResponse } from '../../../core/decorators/lg-response.decorator'
import { AuthorizationGuard } from '../../../core/guards/authorization.guard'
import { GetIssuesDto, GetIssuesQuery } from '../../../models/issues.model'
import { IIssuesService } from './issues.service.interface'

// TODO: Determine usage - currently no tRPC routers call this controller
// By default controllers that are not used, will have admin API only access
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, AuthorizationGuard)
@AdminAccess()
@Controller({
  path: 'issues',
  version: '1',
})
export class IssuesController {
  constructor(
    @Inject(IIssuesService)
    private readonly issuesService: IIssuesService,
  ) {}

  @Get('all')
  @LGResponse({
    operationId: 'getAllPublishedIssues',
    type: GetIssuesDto,
  })
  getAllPublishedIssues(@Query() query: GetIssuesQuery): Promise<GetIssuesDto> {
    return this.issuesService.getAllPublishedIssues(query)
  }
}
