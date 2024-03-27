import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  Case,
  CaseEditorialOverview,
  GetCasesQuery,
  GetCasesReponse,
  GetDepartmentsQueryParams,
  GetDepartmentsResponse,
  GetUsersQueryParams,
  GetUsersResponse,
} from '@dmr.is/shared/dto'

import { Controller, Get, Inject, Param, Query } from '@nestjs/common'
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger'

import { ICaseService } from './case.service.interface'

@Controller({
  version: '1',
})
export class CaseController {
  constructor(
    @Inject(ICaseService)
    private readonly caseService: ICaseService,
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
  ) {}

  @Get('case')
  @ApiQuery({ name: 'id', type: String, required: true })
  @ApiOperation({
    operationId: 'getCase',
    summary: 'Get case by ID.',
  })
  @ApiResponse({
    status: 200,
    type: Case,
    description: 'Case by ID.',
  })
  @ApiResponse({
    status: 404,
    description: 'Case not found.',
  })
  async case(@Query('id') id: string): Promise<Case | null> {
    return this.caseService.getCase(id)
  }

  @Get('cases')
  @ApiOperation({
    operationId: 'getCases',
    summary: 'Get cases.',
  })
  @ApiResponse({
    status: 200,
    type: GetCasesReponse,
    description: 'All cases.',
  })
  async cases(@Query() params?: GetCasesQuery): Promise<GetCasesReponse> {
    return this.caseService.getCases(params)
  }

  @Get('users')
  @ApiOperation({
    operationId: 'getUsers',
    summary: 'Get users.',
  })
  @ApiResponse({
    status: 200,
    type: GetUsersResponse,
    description: 'All active users.',
  })
  async users(
    @Query() params?: GetUsersQueryParams,
  ): Promise<GetUsersResponse> {
    return this.caseService.getUsers(params)
  }

  @Get('editorialOverview')
  @ApiOperation({
    operationId: 'getEditorialOverview',
    summary: 'Get overview for cases in progress.',
  })
  @ApiResponse({
    status: 200,
    type: CaseEditorialOverview,
    description: 'Cases overview.',
  })
  async editorialOverview(
    @Query() params?: GetCasesQuery,
  ): Promise<CaseEditorialOverview> {
    return this.caseService.getEditorialOverview(params)
  }
}
