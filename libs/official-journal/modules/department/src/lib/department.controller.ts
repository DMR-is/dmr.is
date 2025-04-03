import { ResultWrapper } from '@dmr.is/types'
import { UUIDValidationPipe } from '@dmr.is/pipelines'
import { Controller, Get, Inject, Param, Query } from '@nestjs/common'
import { ApiOperation, ApiResponse } from '@nestjs/swagger'
import { GetDepartmentResponse } from './dto/get-department-response.dto'
import { GetDepartmentsQueryParams } from './dto/get-departments-query.dto'
import { GetDepartmentsResponse } from './dto/get-departments-response.dto'
import { IDepartmentService } from './department.service.interface'

@Controller({
  path: 'departments',
  version: '1',
})
export class DepartmentController {
  constructor(
    @Inject(IDepartmentService)
    private readonly departmentService: IDepartmentService,
  ) {}

  @Get(':id')
  @ApiOperation({ operationId: 'getDepartmentById' })
  @ApiResponse({ status: 200, type: GetDepartmentResponse })
  async department(
    @Param('id', new UUIDValidationPipe()) id: string,
  ): Promise<GetDepartmentResponse> {
    return ResultWrapper.unwrap(await this.departmentService.getDepartment(id))
  }

  @Get()
  @ApiOperation({ operationId: 'getDepartments' })
  @ApiResponse({ status: 200, type: GetDepartmentsResponse })
  async departments(
    @Query()
    params?: GetDepartmentsQueryParams,
  ): Promise<GetDepartmentsResponse> {
    return ResultWrapper.unwrap(
      await this.departmentService.getDepartments(params),
    )
  }
}
