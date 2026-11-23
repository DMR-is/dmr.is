import { Controller, Get, Inject, Query } from '@nestjs/common'
import { ApiOperation, ApiResponse } from '@nestjs/swagger'

import {
  GetMonthlyIssuesQueryDto,
  GetMonthlyIssuesResponseDto,
} from './issues.dto'
import { IIssuesReadService } from './issues-read.service.interface'

/**
 * Public read of the monthly issues. Mounted on the public journal API and on
 * the admin API; generating issues lives in `IssuesAdminController`.
 */
@Controller({
  version: '1',
  path: 'issues',
})
export class IssuesController {
  constructor(
    @Inject(IIssuesReadService)
    private readonly issuesService: IIssuesReadService,
  ) {}

  @Get()
  @ApiOperation({ operationId: 'getMonthlyIssues' })
  @ApiResponse({
    status: 200,
    description: 'List of monthly issues',
    type: GetMonthlyIssuesResponseDto,
  })
  async getMonthlyIssues(
    @Query() query: GetMonthlyIssuesQueryDto,
  ): Promise<GetMonthlyIssuesResponseDto> {
    return this.issuesService.getIssues(query)
  }
}
