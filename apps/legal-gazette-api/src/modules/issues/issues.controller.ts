import { Controller, Get, Inject, Param, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'

import { TokenJwtAuthGuard } from '@dmr.is/modules'

import { LGResponse } from '../../core/decorators/lg-response.decorator'
import { GetIssuesDto } from './dto/issues.dto'
import { IIssuesService } from './issues.service.interface'

@Controller({
  path: 'issues',
  version: '1',
})
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard)
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
