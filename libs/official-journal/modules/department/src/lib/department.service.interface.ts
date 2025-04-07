import { DefaultSearchParams } from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

import { Department } from './dto/department.dto'
import { GetDepartmentResponse } from './dto/get-department-response.dto'
import { GetDepartmentsResponse } from './dto/get-departments-response.dto'

export interface IDepartmentService {
  getDepartment(id: string): Promise<ResultWrapper<GetDepartmentResponse>>
  getDepartments(
    params?: DefaultSearchParams,
  ): Promise<ResultWrapper<GetDepartmentsResponse>>
  insertDepartment(
    model: Department,
  ): Promise<ResultWrapper<GetDepartmentResponse>>
  updateDepartment(
    model: Department,
  ): Promise<ResultWrapper<GetDepartmentResponse>>
}

export const IDepartmentService = Symbol('IDepartmentService')
