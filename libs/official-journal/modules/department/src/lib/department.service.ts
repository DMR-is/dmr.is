import { Op } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'
import { DEFAULT_PAGE_SIZE } from '@dmr.is/constants'
import { LogAndHandle } from '@dmr.is/decorators'
import {
  AdvertDepartmentModel,
  AdvertMainTypeModel,
  AdvertTypeModel,
} from '@dmr.is/official-journal/models'
import { baseEntityMigrate, DefaultSearchParams } from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'
import { generatePaging } from '@dmr.is/utils'

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { Department } from './dto/department.dto'
import { GetDepartmentResponse } from './dto/get-department-response.dto'
import { GetDepartmentsResponse } from './dto/get-departments-response.dto'
import { IDepartmentService } from './department.service.interface'

@Injectable()
export class DepartmentService implements IDepartmentService {
  constructor(
    @InjectModel(AdvertDepartmentModel)
    private readonly advertDepartmentModel: typeof AdvertDepartmentModel,
    private readonly sequelize: Sequelize,
  ) {}

  @LogAndHandle()
  async getDepartment(
    id: string,
  ): Promise<ResultWrapper<GetDepartmentResponse>> {
    if (!id) {
      throw new BadRequestException()
    }

    const department = await this.advertDepartmentModel.findOne({
      where: { id },
    })

    if (!department) {
      throw new NotFoundException(`Department<${id}> not found`)
    }

    return ResultWrapper.ok({ department: baseEntityMigrate(department) })
  }

  @LogAndHandle()
  async getDepartments(
    params?: DefaultSearchParams,
  ): Promise<ResultWrapper<GetDepartmentsResponse>> {
    const page = params?.page ?? 1
    const pageSize = params?.pageSize ?? DEFAULT_PAGE_SIZE

    const whereParams = {
      slug: {
        [Op.like]: '%deild%',
      },
    }
    if (params?.search) {
      Object.assign(whereParams, {
        title: { [Op.iLike]: `%${params.search}%` },
      })
    }

    const departments = await this.advertDepartmentModel.findAndCountAll({
      distinct: true,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      order: [['title', 'ASC']],
      include: [
        { model: AdvertMainTypeModel, include: [{ model: AdvertTypeModel }] },
      ],
      where: whereParams,
    })

    const mapped = departments.rows.map((item) => baseEntityMigrate(item))
    const paging = generatePaging(mapped, page, pageSize, departments.count)

    return ResultWrapper.ok({
      departments: mapped,
      paging,
    })
  }

  @LogAndHandle()
  async insertDepartment(
    model: Department,
  ): Promise<ResultWrapper<GetDepartmentResponse>> {
    if (!model) {
      throw new BadRequestException()
    }

    const dep = await this.advertDepartmentModel.create({
      title: model.title,
      slug: model.slug,
    })

    return ResultWrapper.ok({ department: baseEntityMigrate(dep) })
  }

  @LogAndHandle()
  async updateDepartment(
    model: Department,
  ): Promise<ResultWrapper<GetDepartmentResponse>> {
    if (!model || !model.id) {
      throw new BadRequestException()
    }

    const dep = await this.advertDepartmentModel.update(
      { title: model.title, slug: model.slug },
      { where: { id: model.id }, returning: true },
    )

    if (!dep) {
      throw new NotFoundException(`Department<${model.id}> not found`)
    }

    return ResultWrapper.ok({
      department: baseEntityMigrate(dep[1][0]),
    })
  }
}
