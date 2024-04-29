import { Op, WhereOptions } from 'sequelize'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  Advert as AdvertDTO,
  AdvertAttachment,
  GetAdvertSignatureQuery,
  GetAdvertSignatureResponse,
  GetAdvertsQueryParams,
  GetAdvertsResponse,
  GetAdvertTypesQueryParams,
  GetAdvertTypesResponse,
  GetCategoriesQueryParams,
  GetCategoriesResponse,
  GetDepartmentsQueryParams,
  GetDepartmentsResponse,
  GetInstitutionsQueryParams,
  GetInstitutionsResponse,
  GetMainCategoriesQueryParams,
  GetMainCategoriesResponse,
  PostApplicationBody,
  PostApplicationResponse,
} from '@dmr.is/shared/dto'
import { generatePaging } from '@dmr.is/utils'

import { Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { Advert } from '../models/Advert'
import { AdvertAttachments } from '../models/AdvertAttachments'
import { AdvertCategories } from '../models/AdvertCategories'
import { AdvertCategory } from '../models/AdvertCategory'
import { AdvertDepartment } from '../models/AdvertDepartment'
import { AdvertInvolvedParty } from '../models/AdvertInvolvedParty'
import { AdvertMainCategory } from '../models/AdvertMainCategory'
import { AdvertStatus } from '../models/AdvertStatus'
import { AdvertStatusHistory } from '../models/AdvertStatusHistory'
import { AdvertType } from '../models/AdvertType'
import { advertCategoryMigrate } from '../util/advert-category-migrate'
import { advertDepartmentMigrate } from '../util/advert-department-migrate'
import { advertInvolvedPartyMigrate } from '../util/advert-involvedparty-migrate'
import { advertMainCategoryMigrate } from '../util/advert-main-category-migrate'
import { advertMigrate } from '../util/advert-migrate'
import { advertTypesMigrate } from '../util/advert-types-migrate'
import { IJournalService } from './journal.service.interface'
const LOGGING_CATEGORY = 'JournalService'

@Injectable()
export class JournalService implements IJournalService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,

    @InjectModel(AdvertDepartment)
    private advertDepartmentModel: typeof AdvertDepartment,

    @InjectModel(AdvertType)
    private advertTypeModel: typeof AdvertType,

    @InjectModel(Advert)
    private advertModel: typeof Advert,

    @InjectModel(AdvertCategories)
    private advertCategoriesModel: typeof AdvertCategories,

    @InjectModel(AdvertCategory)
    private advertCategoryModel: typeof AdvertCategory,

    @InjectModel(AdvertInvolvedParty)
    private advertInvolvedPartyModel: typeof AdvertInvolvedParty,

    @InjectModel(AdvertStatus)
    private advertStatusModel: typeof AdvertStatus,

    @InjectModel(AdvertStatusHistory)
    private advertStatusHistoryModel: typeof AdvertStatusHistory,

    @Inject(AdvertMainCategory)
    private advertMainCategoryModel: typeof AdvertMainCategory,

    private PAGING_DEFAULT_PAGE_SIZE = 10,
  ) {
    this.logger.log({ level: 'info', message: 'JournalService' })
  }

  async getAdvert(id: string): Promise<AdvertDTO | null> {
    const model = await this.advertModel.findOne({
      include: [
        AdvertInvolvedParty,
        AdvertAttachments,
        AdvertStatus,
        AdvertCategory,
      ],
      where: { id },
    })
    if (model) {
      const result = advertMigrate(model)
      return result
    }
    return null
  }

  async getAdverts(
    params?: GetAdvertsQueryParams,
  ): Promise<GetAdvertsResponse> {
    console.log(params)
    const adverts = await this.advertModel.findAll({
      include: [
        AdvertInvolvedParty,
        AdvertAttachments,
        AdvertStatus,
        AdvertCategory,
      ],
    })
    const migratedAdverts = adverts.map((item) => advertMigrate(item))
    const result: GetAdvertsResponse = {
      adverts: migratedAdverts,
      paging: generatePaging(migratedAdverts, params?.page ?? 1),
    }
    return result
  }

  async getDepartments(
    params?: GetDepartmentsQueryParams,
  ): Promise<GetDepartmentsResponse> {
    const deparmentDTO = await this.advertDepartmentModel.findAll({
      include: [AdvertType],
      limit: this.PAGING_DEFAULT_PAGE_SIZE,
      offset: ((params?.page ?? 1) - 1) * this.PAGING_DEFAULT_PAGE_SIZE,
    })
    const departments = deparmentDTO.map((item) =>
      advertDepartmentMigrate(item),
    )
    const result: GetDepartmentsResponse = {
      departments,
      paging: generatePaging(departments, params?.page ?? 1),
    }
    return result
  }

  async getTypes(
    params?: GetAdvertTypesQueryParams,
  ): Promise<GetAdvertTypesResponse> {
    /* let where: WhereOptions = {}
    if (params?.department) {
      where = params.departmentId
    }
    // TODO don't table scan, need an index on title
    if (params?.search) {
      where.title = {
        [Op.iLike]: `%${params.search}%`,
      }
    }*/
    const typesDTO = await this.advertTypeModel.findAll({
      include: params?.department ? [AdvertDepartment] : undefined,
      // where,
      limit: this.PAGING_DEFAULT_PAGE_SIZE,
      offset: ((params?.page ?? 1) - 1) * this.PAGING_DEFAULT_PAGE_SIZE,
    })
    const paging = generatePaging(typesDTO, params?.page ?? 1)

    const types = typesDTO.map((item) => advertTypesMigrate(item))

    const result: GetAdvertTypesResponse = {
      types,
      paging,
    }
    return result
  }

  async getCategories(
    params?: GetCategoriesQueryParams,
  ): Promise<GetCategoriesResponse> {
    const categoriesDTO = await this.advertCategoryModel.findAll({
      include: [AdvertCategory],
    })
    const categories = categoriesDTO.map((item) => advertCategoryMigrate(item))

    const result: GetCategoriesResponse = {
      categories,
      paging: generatePaging(categories, params?.page ?? 1),
    }

    return result
  }

  submitApplication(
    body: PostApplicationBody,
  ): Promise<PostApplicationResponse> {
    this.logger.log('submitApplication', { body })
    throw new Error('Method not implemented.')
  }

  error(): void {
    this.logger.warn('about to throw error from service', {
      category: LOGGING_CATEGORY,
    })
    throw new Error('error from service')
  }

  async getMainCategories(
    params?: GetMainCategoriesQueryParams,
  ): Promise<GetMainCategoriesResponse> {
    const mainCategoriesDTO = await this.advertMainCategoryModel.findAll()
    const mainCategories = mainCategoriesDTO.map((item) =>
      advertMainCategoryMigrate(item),
    )

    const result: GetMainCategoriesResponse = {
      mainCategories,
      paging: generatePaging(mainCategories, params?.page ?? 1),
    }
    return result
  }
  async getInstitutions(
    params?: GetInstitutionsQueryParams,
  ): Promise<GetInstitutionsResponse> {
    const institutionsDTO = await this.advertInvolvedPartyModel.findAll()
    const institutions = institutionsDTO.map((item) =>
      advertInvolvedPartyMigrate(item),
    )

    const result: GetInstitutionsResponse = {
      institutions,
      paging: generatePaging(institutions, params?.page ?? 1),
    }
    return result
  }
  getSignatures(
    params?: GetAdvertSignatureQuery,
  ): Promise<GetAdvertSignatureResponse> {
    throw new Error('Method not implemented.')
  }
}
