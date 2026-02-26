import { Controller, Get, Inject, Query } from '@nestjs/common'

import { PublicController } from '../../../core/decorators'
import { LGResponse } from '../../../core/decorators/lg-response.decorator'
import { GetIssuesDto, GetIssuesQuery } from './dto/issues.dto'
import { IIssuesService } from './issues.service.interface'

@PublicController()
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
