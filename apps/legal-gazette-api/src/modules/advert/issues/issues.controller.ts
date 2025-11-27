import { Controller, Get, Inject, Param, UseGuards } from '@nestjs/common'

import { LGResponse } from '../../../core/decorators/lg-response.decorator'
import { GetIssuesDto } from '../../../models/issues.model'
import { IIssuesService } from './issues.service.interface'

@Controller({
  path: 'issues',
  version: '1',
})
export class IssuesController {
  constructor(
    @Inject(IIssuesService)
    private readonly issuesService: IIssuesService,
  ) {}

  @Get('all/:year')
  @LGResponse({
    operationId: 'getAllIssuesByYear',
    type: GetIssuesDto,
  })
  getAllIssuesByYear(@Param('year') year: string): Promise<GetIssuesDto> {
    return this.issuesService.getAllIssuesByYear(year)
  }
}
