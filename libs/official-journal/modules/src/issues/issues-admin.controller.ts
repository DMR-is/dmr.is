import { Controller, Inject, Post, Query, UseGuards } from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOperation,
} from '@nestjs/swagger'

import { UserRoleEnum } from '@dmr.is/constants'
import { Roles } from '@dmr.is/decorators'
import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { RoleGuard, StaffTokenGuard } from '../guards/auth'
import { GenerateMonthlyIssuesQueryDto } from './issues.dto'
import { IIssuesService } from './issues.service.interface'

/** Staff-only issue generation. Mounted on the admin API only. */
@Controller({
  version: '1',
  path: 'issues',
})
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, StaffTokenGuard, RoleGuard)
@Roles(UserRoleEnum.Admin)
export class IssuesAdminController {
  constructor(
    @Inject(IIssuesService) private readonly issuesService: IIssuesService,
  ) {}

  @Post('generate')
  @ApiOperation({ operationId: 'generateMonthlyIssues' })
  @ApiNoContentResponse({ description: 'Monthly issues generation started' })
  async generateMonthlyIssues(@Query() query: GenerateMonthlyIssuesQueryDto) {
    return this.issuesService.generateMonthlyIssues(
      query.departmentId,
      query.date,
    )
  }
}
