import { Controller, Get, Inject, Query } from '@nestjs/common'

import { LGResponse } from '../../../core/decorators/lg-response.decorator'
import { GetIssuesDto, GetIssuesQuery } from '../../../models/issues.model'
import { IIssuesService } from './issues.service.interface'

// NOTE: This controller does not require authentication
// This is used before authenticating users
/* eslint-disable local-rules/require-controller-auth-decorators */
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
