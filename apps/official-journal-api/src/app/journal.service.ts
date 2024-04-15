import { CustomLogger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { JournalAdvert } from '../dto/adverts/journal-advert.dto'
import { IJournalService, ServiceResult } from './journal.service.interface'
import { JournalAdvertsResponse } from '../dto/adverts/journal-advert-responses.dto'
import { JournalGetAdvertsQueryParams } from '../dto/adverts/journal-getadverts-query.dto'
import { JournalGetTypesQueryParams } from '../dto/types/journal-gettypes-query.dto'
import { JournalGetDepartmentsQueryParams } from '../dto/departments/journal-getdepartments-query.dto'
import { JournalAdvertDepartmentsResponse } from '../dto/departments/journal-getdepartments-response.dto'
import { JournalAdvertTypesResponse } from '../dto/types/journal-gettypes-response.dto'
import { JournalGetCategoriesQueryParams } from '../dto/categories/journal-getcategories-query.dto'
import { JournalAdvertCategoriesResponse } from '../dto/categories/journal-getcategories-responses.dto'
import { JournalPostApplicationBody } from '../dto/application/journal-postapplication-body.dto'
import { JournalPostApplicationResponse } from '../dto/application/journal-postapplication-response.dto'
import { AdvertDepartment } from '../models/AdvertDepartment'
import { AdvertType } from '../models/AdvertType'
import { generatePaging } from '../lib/paging'
import { Op, WhereOptions } from 'sequelize'
import { PAGING_DEFAULT_PAGE_SIZE } from '../dto/journal-constants.dto'

const LOGGING_CATEGORY = 'JournalService'

@Injectable()
export class JournalService implements IJournalService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: CustomLogger,
    @InjectModel(AdvertDepartment)
    private advertDepartmentModel: typeof AdvertDepartment,
    @InjectModel(AdvertType)
    private advertTypeModel: typeof AdvertType,
  ) {
    this.logger.log('JournalService')
  }

  getAdverts(
    params: JournalGetAdvertsQueryParams | undefined,
  ): Promise<ServiceResult<JournalAdvertsResponse>> {
    console.log(params)
    throw new Error('Method not implemented.')
  }

  async getDepartments(
    params?: JournalGetDepartmentsQueryParams | undefined,
  ): Promise<ServiceResult<JournalAdvertDepartmentsResponse>> {
    const departments = await this.advertDepartmentModel.findAll()
    const totalItems = await this.advertDepartmentModel.count()

    const result: JournalAdvertDepartmentsResponse = {
      departments,
      paging: generatePaging(totalItems, params?.page ?? 1),
    }
    return { type: 'ok', value: result }
  }

  async getTypes(
    params?: JournalGetTypesQueryParams | undefined,
  ): Promise<ServiceResult<JournalAdvertTypesResponse>> {
    const where: WhereOptions = {}
    if (params?.departmentId) {
      where.departmentId = params.departmentId
    }
    // TODO don't table scan, need an index on title
    if (params?.search) {
      where.title = {
        [Op.iLike]: `%${params.search}%`,
      }
    }
    const types = await this.advertTypeModel.findAll({
      include: params?.includeDepartment ? [AdvertDepartment] : undefined,
      where,
      limit: PAGING_DEFAULT_PAGE_SIZE,
      offset: ((params?.page ?? 1) - 1) * PAGING_DEFAULT_PAGE_SIZE,
    })
    const totalItems = await this.advertTypeModel.count({ where })

    const paging = generatePaging(totalItems, params?.page ?? 1)

    if (params?.page && params.page > paging.totalPages) {
      return {
        type: 'error',
        error: {
          message: 'page out of range',
          code: 400,
        },
      }
    }

    const result: JournalAdvertTypesResponse = {
      types,
      paging,
    }
    return { type: 'ok', value: result }
  }

  getCategories(
    params?: JournalGetCategoriesQueryParams | undefined,
  ): Promise<ServiceResult<JournalAdvertCategoriesResponse>> {
    this.logger.log('getCategories', { params })
    throw new Error('Method not implemented.')
  }

  getAdvert(): Promise<ServiceResult<JournalAdvert>> {
    throw new Error('Method not implemented.')
  }

  submitApplication(
    body: JournalPostApplicationBody,
  ): Promise<JournalPostApplicationResponse> {
    this.logger.log('submitApplication', { body })
    throw new Error('Method not implemented.')
  }

  error(): void {
    this.logger.warn('about to throw error from service', {
      category: LOGGING_CATEGORY,
    })
    throw new Error('error from service')
  }
}
