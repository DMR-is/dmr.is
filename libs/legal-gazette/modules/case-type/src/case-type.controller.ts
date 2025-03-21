import { Controller, Get, Inject } from '@nestjs/common'
import { ICaseTypeService } from './case-type.service.interface'
import { ApiOperation, ApiResponse } from '@nestjs/swagger'
import { GetCaseTypesDto } from './dto/case-type.dto'

@Controller({ path: 'types', version: '1' })
export class CaseTypeController {
  constructor(
    @Inject(ICaseTypeService)
    private readonly caseTypeService: ICaseTypeService,
  ) {}

  @Get()
  @ApiOperation({ operationId: 'getTypes' })
  @ApiResponse({ status: 200, type: GetCaseTypesDto })
  async getCaseTypes(): Promise<GetCaseTypesDto> {
    return this.caseTypeService.getCaseTypes()
  }

  @Get('/detailed')
  @ApiOperation({ operationId: 'getTypes' })
  @ApiResponse({ status: 200, type: GetCaseTypesDto })
  async getCaseTypesDetailed(): Promise<GetCaseTypesDto> {
    return this.caseTypeService.getCaseTypesDetail()
  }
}
