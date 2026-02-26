import {
  Controller,
  Get,
  Inject,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger'

import { UserRoleEnum } from '@dmr.is/constants'
import { Roles } from '@dmr.is/decorators'
import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { RoleGuard } from '../guards/auth'
import {
  GenerateMonthlyIssuesQueryDto,
  GetMonthlyIssuesQueryDto,
  GetMonthlyIssuesResponseDto,
} from './issues.dto'
import { IIssuesService } from './issues.service.interface'

@Controller({
  version: '1',
  path: 'issues',
})
export class IssuesController {
  constructor(
    @Inject(IIssuesService) private readonly issuesService: IIssuesService,
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

  @Post('generate')
  @ApiOperation({ operationId: 'generateMonthlyIssues' })
  @ApiNoContentResponse({ description: 'Monthly issues generation started' })
  @ApiBearerAuth()
  @UseGuards(TokenJwtAuthGuard, RoleGuard)
  @Roles(UserRoleEnum.Admin)
  async generateMonthlyIssues(@Query() query: GenerateMonthlyIssuesQueryDto) {
    return this.issuesService.generateMonthlyIssues(
      query.departmentId,
      query.date,
    )
  }
}
