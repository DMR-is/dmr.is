import { Cache } from 'cache-manager'
import { Op, Transaction } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'
import slugify from 'slugify'
import { v4 as uuid } from 'uuid'

import { CACHE_MANAGER } from '@nestjs/cache-manager'
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  NotImplementedException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { Cacheable, LogAndHandle, Transactional } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  AdvertStatus,
  CreateAdvert,
  CreateMainCategory,
  DefaultSearchParams,
  Department,
  GetAdvertResponse,
  GetAdvertSignatureQuery,
  GetAdvertSignatureResponse,
  GetAdvertsQueryParams,
  GetAdvertsResponse,
  GetCategoriesResponse,
  GetCategoryResponse,
  GetDepartmentResponse,
  GetDepartmentsResponse,
  GetInstitutionResponse,
  GetInstitutionsResponse,
  GetMainCategoriesResponse,
  GetMainCategoryResponse,
  GetSimilarAdvertsResponse,
  Institution,
  S3UploadFileResponse,
  UpdateAdvertBody,
  UpdateCategory,
  UpdateMainCategory,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'
import { generatePaging } from '@dmr.is/utils'

import dirtyClean from '@island.is/regulations-tools/dirtyClean-server'
import { HTMLText } from '@island.is/regulations-tools/types'

import { AdvertMainTypeModel, AdvertTypeModel } from '../advert-type/models'
import { IAWSService } from '../aws/aws.service.interface'
import { caseAdditionMigrate } from '../case/migrations/case-addition.migrate'
import { CaseCategoriesModel, CaseModel } from '../case/models'
import { advertUpdateParametersMapper } from './mappers/advert-update-parameters.mapper'
import { advertSimilarMigrate } from './migrations/advert-similar.migrate'
import { removeAllHtmlComments } from './util/removeAllHtmlComments'
import { removeSubjectFromHtml } from './util/removeSubjectFromHtml'
import { IJournalService } from './journal.service.interface'
import {
  advertCategoryMigrate,
  advertDepartmentMigrate,
  advertInvolvedPartyMigrate,
  advertMainCategoryMigrate,
  advertMigrate,
} from './migrations'
import {
  AdvertAttachmentsModel,
  AdvertCategoriesModel,
  AdvertCategoryCategoriesModel,
  AdvertCategoryModel,
  AdvertCorrectionModel,
  AdvertDepartmentModel,
  AdvertInvolvedPartyModel,
  AdvertMainCategoryModel,
  AdvertModel,
  AdvertStatusModel,
} from './models'
const DEFAULT_PAGE_SIZE = 20
const LOGGING_CATEGORY = 'journal-service'
@Injectable()
export class JournalService implements IJournalService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    // This is needed to be able to use the Cacheable and CacheEvict decorators
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache | undefined,
    @InjectModel(AdvertModel)
    private advertModel: typeof AdvertModel,

    @InjectModel(AdvertMainCategoryModel)
    private advertMainCategoryModel: typeof AdvertMainCategoryModel,

    @InjectModel(AdvertDepartmentModel)
    private advertDepartmentModel: typeof AdvertDepartmentModel,
    @InjectModel(AdvertInvolvedPartyModel)
    private advertInvolvedPartyModel: typeof AdvertInvolvedPartyModel,
    @InjectModel(AdvertCategoryModel)
    private advertCategoryModel: typeof AdvertCategoryModel,
    @InjectModel(AdvertCategoriesModel)
    private advertCategoriesModel: typeof AdvertCategoriesModel,
    @InjectModel(AdvertCategoryCategoriesModel)
    private advertCategoryCategoriesModel: typeof AdvertCategoryCategoriesModel,
    @InjectModel(CaseCategoriesModel)
    private caseCategoriesModel: typeof CaseCategoriesModel,
    @Inject(IAWSService)
    private readonly s3Service: IAWSService,

    @InjectModel(CaseModel)
    private caseModel: typeof CaseModel,

    @InjectModel(AdvertStatusModel)
    private advertStatusModel: typeof AdvertStatusModel,
    private readonly sequelize: Sequelize,
  ) {
    this.logger.log({ level: 'info', message: 'JournalService' })
  }

  @LogAndHandle({ logArgs: false })
  async create(
    model: CreateAdvert,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetAdvertResponse>> {
    let id
    if (model.advertId) {
      id = model.advertId
    } else {
      id = uuid()
    }

    const status = await this.advertStatusModel.findOne({
      where: { title: { [Op.eq]: AdvertStatus.Published } },
    })

    if (!status) {
      this.logger.error('Advert status not found', {
        category: LOGGING_CATEGORY,
        metadata: { status: AdvertStatus.Published },
      })
      throw new InternalServerErrorException('Advert status not found')
    }

    const publicationYear = new Date(model.publicationDate).getFullYear()

    const ad = await this.advertModel.create(
      {
        id: id,
        departmentId: model.departmentId,
        typeId: model.typeId,
        statusId: status.id,
        involvedPartyId: model.involvedPartyId,
        subject: model.subject,
        serialNumber: model.serial,
        publicationYear: publicationYear,
        publicationDate: model.publicationDate,
        signatureDate: model.signatureDate,
        documentHtml: model.content,
        documentPdfUrl: model.pdfUrl,
        isLegacy: false,
      },
      {
        transaction,
        returning: ['id'],
      },
    )

    await Promise.all(
      model.categories.map((id) => {
        this.advertCategoriesModel.create(
          {
            advert_id: ad.id,
            category_id: id,
          },
          { transaction },
        )
      }),
    )

    const advert = await this.advertModel.findByPk(ad.id, {
      include: [
        { model: AdvertTypeModel, include: [AdvertDepartmentModel] },
        AdvertDepartmentModel,
        AdvertStatusModel,
        AdvertInvolvedPartyModel,
        AdvertAttachmentsModel,
        AdvertCategoryModel,
      ],
      transaction,
    })

    if (!advert) {
      throw new InternalServerErrorException(`Advert<${ad.id}> not found`)
    }

    return ResultWrapper.ok({ advert: advertMigrate(advert) })
  }

  @LogAndHandle()
  async updateAdvert(
    advertId: string,
    body: UpdateAdvertBody,
  ): Promise<ResultWrapper<GetAdvertResponse>> {
    if (!body) {
      return ResultWrapper.err({
        message: 'No body provided',
        code: 400,
      })
    }

    const updateParams = advertUpdateParametersMapper(body)

    await this.advertModel.update(updateParams, {
      where: { id: advertId },
    })

    const advert = await this.getAdvert(advertId)

    if (!advert.result.ok) {
      this.logger.error('Failed to get updated advert', {
        category: 'JournalService',
        metadata: { advertId },
      })

      return ResultWrapper.err({
        message: 'Failed to get updated advert',
        code: 500,
      })
    }

    return ResultWrapper.ok({ advert: advert.result.value.advert })
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

    return ResultWrapper.ok({ department: advertDepartmentMigrate(dep) })
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
      department: advertDepartmentMigrate(dep[1][0]),
    })
  }

  @LogAndHandle()
  async insertInstitution(
    model: Institution,
  ): Promise<ResultWrapper<GetInstitutionResponse>> {
    if (!model) {
      throw new BadRequestException()
    }

    const inst = await this.advertInvolvedPartyModel.create({
      title: model.title,
      slug: model.slug,
    })

    return ResultWrapper.ok({ institution: advertInvolvedPartyMigrate(inst) })
  }

  @LogAndHandle()
  async updateInstitution(
    model: Institution,
  ): Promise<ResultWrapper<GetInstitutionResponse>> {
    if (!model || !model.id) {
      throw new BadRequestException()
    }

    const inst = await this.advertInvolvedPartyModel.update(
      { title: model.title, slug: model.slug },
      { where: { id: model.id }, returning: true },
    )

    if (!inst) {
      throw new NotFoundException(`Institution<${model.id}> not found`)
    }

    return ResultWrapper.ok({
      institution: advertInvolvedPartyMigrate(inst[1][0]),
    })
  }

  @LogAndHandle()
  async getSignatures(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    params?: GetAdvertSignatureQuery,
  ): Promise<ResultWrapper<GetAdvertSignatureResponse>> {
    throw new NotImplementedException()
  }

  @LogAndHandle()
  error(): void {
    throw new NotImplementedException()
  }

  @LogAndHandle()
  @Transactional()
  async insertMainCategory(
    model: CreateMainCategory,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetMainCategoryResponse>> {
    if (!model) {
      throw new BadRequestException()
    }

    const newMainCatId = uuid()

    const mainCategory = await this.advertMainCategoryModel.create(
      {
        id: newMainCatId,
        title: model.title,
        slug: slugify(model.title, { lower: true }),
        description: model.description,
        departmentId: model.departmentId,
      },
      {
        transaction,
      },
    )

    const relations = await this.advertCategoryCategoriesModel.bulkCreate(
      model.categories.map((id) => ({
        mainCategoryId: newMainCatId,
        categoryId: id,
      })),
      { transaction },
    )

    await Promise.all(relations)

    return ResultWrapper.ok({
      mainCategory: advertMainCategoryMigrate(mainCategory),
    })
  }

  @LogAndHandle()
  async deleteMainCategory(id: string): Promise<ResultWrapper> {
    if (!id) {
      return ResultWrapper.err({
        message: 'No id provided',
        code: 400,
      })
    }

    const mainCategory = await this.advertMainCategoryModel.findByPk(id)

    const relations = await this.advertCategoryCategoriesModel.findAll({
      where: { mainCategoryId: id },
    })

    await Promise.all(relations.map((r) => r.destroy()))

    if (!mainCategory) {
      this.logger.warn(`Delete main category<${id}> not found`, {
        category: LOGGING_CATEGORY,
      })
      return ResultWrapper.err({
        message: `Main category<${id}> not found`,
        code: 404,
      })
    }

    await mainCategory.destroy()

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  async deleteMainCategoryCategory(
    mainCategoryId: string,
    categoryId: string,
  ): Promise<ResultWrapper> {
    await this.advertCategoryCategoriesModel.destroy({
      where: { mainCategoryId, categoryId },
    })

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  async insertMainCategoryCategories(
    mainCategoryId: string,
    categoryIds: string[],
  ): Promise<ResultWrapper> {
    const promises = categoryIds.map((id) =>
      this.advertCategoryCategoriesModel.create({
        mainCategoryId: mainCategoryId,
        categoryId: id,
      }),
    )

    await Promise.all(promises)

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  async updateMainCategory(
    id: string,
    body: UpdateMainCategory,
  ): Promise<ResultWrapper<GetMainCategoryResponse>> {
    const updateTransaction = await this.sequelize.transaction()
    try {
      const found = await this.advertMainCategoryModel.findByPk(id, {
        transaction: updateTransaction,
      })

      if (!found) {
        return ResultWrapper.err({
          message: `Main category<${id}> not found`,
          code: 404,
        })
      }

      const updateBody = {
        title: body.title ? body.title : found.title,
        slug: body.title ? slugify(body.title, { lower: true }) : found.slug,
        description: body.description ? body.description : found.description,
        departmentId: body.departmentId
          ? body.departmentId
          : found.departmentId,
      }

      await found.update(updateBody, {
        transaction: updateTransaction,
      })

      await updateTransaction.commit()
      return ResultWrapper.ok()
    } catch (error) {
      this.logger.error(`Failed to update MainCategory<${id}>`, {
        category: LOGGING_CATEGORY,
        error: error,
      })
      await updateTransaction.rollback()
      return ResultWrapper.err({
        message: 'Failed to update MainCategory',
        code: 500,
      })
    }
  }

  @LogAndHandle()
  async insertCategory(
    title: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetCategoryResponse>> {
    if (!title) {
      throw new BadRequestException()
    }

    const slug = slugify(title, { lower: true })

    const category = await this.advertCategoryModel.create(
      {
        title,
        slug,
      },
      {
        transaction,
        returning: true,
      },
    )

    return ResultWrapper.ok({ category: advertCategoryMigrate(category) })
  }

  @LogAndHandle()
  async mergeCategories(
    fromId: string,
    toId: string,
    transaction?: Transaction,
  ) {
    if (!fromId || !toId) {
      throw new BadRequestException()
    }
    const fromCategory = await this.advertCategoryModel.findByPk(fromId)
    const toCategory = await this.advertCategoryModel.findByPk(toId)
    if (!fromCategory || !toCategory) {
      throw new NotFoundException(
        `Category<${fromId}> or Category<${toId}> not found`,
      )
    }

    const advertsThatConflict = await this.advertCategoriesModel.findAll({
      where: {
        category_id: fromId,
      },
      transaction,
    })
    const secondAdvertThatConflict = await this.advertCategoriesModel.findAll({
      where: {
        category_id: toId,
      },
      transaction,
    })

    const advertCategoriesDelete: Array<AdvertCategoriesModel> = []

    advertsThatConflict.forEach((advert) => {
      if (
        secondAdvertThatConflict.some(
          (secondAdvert) => secondAdvert.advert_id === advert.advert_id,
        )
      ) {
        advertCategoriesDelete.push(advert)
      }
    })

    await Promise.all(
      advertCategoriesDelete.map((element) => {
        this.advertCategoriesModel.destroy({
          where: {
            advert_id: element.advert_id,
            category_id: element.category_id,
          },
          transaction,
        })
      }),
    )

    const advertMigrate = await this.advertCategoriesModel.update(
      { category_id: toId },
      { where: { category_id: fromId }, transaction, returning: true },
    )

    if (!advertMigrate) {
      throw new NotFoundException(`Advert category merge failed`)
    }

    const caseConflictFrom = await this.caseCategoriesModel.findAll({
      where: {
        category_id: fromId,
      },
      transaction,
    })

    const caseConflictTo = await this.caseCategoriesModel.findAll({
      where: {
        category_id: toId,
      },
      transaction,
    })

    const caseConflictDelete: Array<CaseCategoriesModel> = []

    caseConflictFrom.forEach((fromCase) => {
      if (
        caseConflictTo.some(
          (secondCase) => fromCase.caseId === secondCase.caseId,
        )
      ) {
        caseConflictDelete.push(fromCase)
      }
    })

    await Promise.all(
      caseConflictDelete.map((element) => {
        this.caseCategoriesModel.destroy({
          where: {
            case_case_id: element.caseId,
            category_id: element.categoryId,
          },
          transaction,
        })
      }),
    )

    const caseMigrate = await this.caseCategoriesModel.update(
      { category_id: toId },
      { where: { category_id: fromId }, transaction, returning: true },
    )

    if (!caseMigrate) {
      throw new NotFoundException(`Case Categories merge failed`)
    }

    await this.advertCategoryCategoriesModel.destroy({
      where: { advert_category_id: fromId },
      transaction,
    })

    await this.advertCategoryModel.destroy({
      where: { id: fromId },
      transaction,
    })

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  async deleteCategory(id: string): Promise<ResultWrapper> {
    if (!id) {
      return ResultWrapper.err({
        message: 'No id provided',
        code: 400,
      })
    }

    await this.advertCategoryModel.destroy({ where: { id } })

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  async updateCategory(
    id: string,
    model: UpdateCategory,
  ): Promise<ResultWrapper<GetCategoryResponse>> {
    if (!model || !model.title) {
      throw new BadRequestException()
    }

    const slug = slugify(model.title, { lower: true })
    const category = await this.advertCategoryModel.update(
      {
        title: model.title,
        slug,
      },
      { where: { id: id }, returning: true },
    )

    if (!category) {
      throw new NotFoundException(`Category<${id}> not found`)
    }

    return ResultWrapper.ok({ category: advertCategoryMigrate(category[1][0]) })
  }

  @LogAndHandle()
  async getMainCategories(
    params?: DefaultSearchParams,
  ): Promise<ResultWrapper<GetMainCategoriesResponse>> {
    const page = params?.page ?? 1
    const pageSize = params?.pageSize ?? DEFAULT_PAGE_SIZE

    const whereParams = {}

    if (params?.search) {
      Object.assign(whereParams, {
        title: { [Op.iLike]: `%${params.search}%` },
      })
    }

    const mainCategories = await this.advertMainCategoryModel.findAndCountAll({
      distinct: true,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      where: whereParams,
      include: [AdvertCategoryModel],
    })

    const mapped = mainCategories.rows.map((cat) =>
      advertMainCategoryMigrate(cat),
    )
    const paging = generatePaging(mapped, page, pageSize, mainCategories.count)

    return ResultWrapper.ok({
      mainCategories: mapped,
      paging,
    })
  }

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

    return ResultWrapper.ok({ department: advertDepartmentMigrate(department) })
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

    const mapped = departments.rows.map((item) => advertDepartmentMigrate(item))
    const paging = generatePaging(mapped, page, pageSize, departments.count)

    return ResultWrapper.ok({
      departments: mapped,
      paging,
    })
  }

  @LogAndHandle()
  async getInstitution(
    id: string,
  ): Promise<ResultWrapper<GetInstitutionResponse>> {
    if (!id) {
      throw new BadRequestException()
    }
    const party = await this.advertInvolvedPartyModel.findOne({
      where: { id },
    })
    if (!party) {
      throw new NotFoundException(`Institution<${id}> not found`)
    }

    return ResultWrapper.ok({ institution: advertInvolvedPartyMigrate(party) })
  }

  @LogAndHandle()
  async getInstitutions(
    params?: DefaultSearchParams,
  ): Promise<ResultWrapper<GetInstitutionsResponse>> {
    const page = params?.page ?? 1
    const pageSize = params?.pageSize ?? DEFAULT_PAGE_SIZE

    const parties = await this.advertInvolvedPartyModel.findAndCountAll({
      distinct: true,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      order: [['title', 'ASC']],
      where: params?.search
        ? {
            title: { [Op.iLike]: `%${params?.search}%` },
          }
        : undefined,
    })

    const mapped = parties.rows.map((item) => advertInvolvedPartyMigrate(item))
    const paging = generatePaging(mapped, page, pageSize, parties.count)

    return ResultWrapper.ok({
      institutions: mapped,
      paging,
    })
  }

  @LogAndHandle()
  async getCategory(id: string): Promise<ResultWrapper<GetCategoryResponse>> {
    if (!id) {
      throw new BadRequestException()
    }

    const category = await this.advertCategoryModel.findOne({
      where: { id },
      include: AdvertMainCategoryModel,
    })

    if (!category) {
      throw new NotFoundException(`Category<${id}> not found`)
    }

    return ResultWrapper.ok({ category: advertCategoryMigrate(category) })
  }

  @LogAndHandle()
  @Cacheable()
  async getCategories(
    params?: DefaultSearchParams,
  ): Promise<ResultWrapper<GetCategoriesResponse>> {
    const page = params?.page ?? 1
    const pageSize = params?.pageSize ?? DEFAULT_PAGE_SIZE

    const whereParams = {}

    if (params?.search) {
      Object.assign(whereParams, {
        title: { [Op.iLike]: `%${params.search}%` },
      })
    }

    if (params?.ids) {
      Object.assign(whereParams, {
        id: params.ids,
      })
    }

    const categories = await this.advertCategoryModel.findAndCountAll({
      distinct: true,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      order: [['title', 'ASC']],
      where: whereParams,
      include: [
        {
          model: AdvertMainCategoryModel,
          through: {
            attributes: ['advert_main_category_id', 'advert_category_id'],
          },
        },
      ],
    })

    const mapped = categories.rows.map((item) => advertCategoryMigrate(item))

    const paging = generatePaging(mapped, page, pageSize, categories.count)

    return ResultWrapper.ok({
      categories: mapped,
      paging,
    })
  }

  @LogAndHandle()
  async getAdvert(id: string): Promise<ResultWrapper<GetAdvertResponse>> {
    if (!id) {
      throw new BadRequestException()
    }
    const advert = await this.advertModel.scope('withAdditions').findByPk(id, {
      include: [
        { model: AdvertTypeModel, include: [AdvertDepartmentModel] },
        AdvertDepartmentModel,
        AdvertStatusModel,
        AdvertInvolvedPartyModel,
        AdvertAttachmentsModel,
        AdvertCategoryModel,
        AdvertCorrectionModel,
      ],
    })

    if (!advert) {
      throw new NotFoundException(`Advert<${id}> not found`)
    }

    const ad = advertMigrate(advert)

    let html = advert.documentHtml
    if (advert.isLegacy) {
      try {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('HTML cleaning timed out')), 5000)
        })

        html = removeAllHtmlComments(html)
        html = removeSubjectFromHtml(html, advert.subject)

        const cleaningPromise = new Promise((resolve, reject) => {
          try {
            const cleaned = dirtyClean(html as HTMLText)
            resolve(cleaned)
          } catch (e) {
            reject(e)
          }
        })

        html = (await Promise.race([cleaningPromise, timeoutPromise])) as string

        await this.advertModel.update(
          {
            documentHtml: html,
            documentLegacyHtml: advert.documentHtml,
            isLegacy: false,
          },
          {
            where: { id },
          },
        )
      } catch (e) {
        this.logger.error("Dirty clean failed for advert's HTML", {
          category: LOGGING_CATEGORY,
          metadata: { advertId: id, error: e },
        })
        html = advert.documentHtml
      }
    }

    return ResultWrapper.ok({
      advert: {
        ...ad,
        additions: advert.case?.additions
          ? advert.case.additions.map((item) => caseAdditionMigrate(item))
          : undefined,
        document: {
          isLegacy: advert.isLegacy,
          html,
          pdfUrl: `${advert.documentPdfUrl}`,
        },
      },
    })
  }

  @LogAndHandle()
  async getSimilarAdverts(
    advertId: string,
    limit = 5,
  ): Promise<ResultWrapper<GetSimilarAdvertsResponse>> {
    // TODO: We might not need the models here, and only get the ids
    const originalAdvert = await this.advertModel.findByPk(advertId, {
      include: [
        { model: AdvertDepartmentModel, as: 'department' },
        { model: AdvertInvolvedPartyModel, as: 'involvedParty' },
        { model: AdvertCategoryModel, as: 'categories' },
        { model: AdvertTypeModel },
      ],
    })

    if (!originalAdvert) {
      throw new NotFoundException(`Advert with ID ${advertId} not found.`)
    }

    const departmentId = originalAdvert.department.id
    const involvedPartyId = originalAdvert.involvedParty.id
    const categoryIds = originalAdvert.categories?.map((c) => c.id) ?? []

    const similarAdverts = await this.advertModel.findAll({
      where: {
        id: {
          [Op.ne]: advertId,
        },
      },
      include: [
        {
          model: AdvertDepartmentModel,
          where: {
            id: {
              [Op.eq]: departmentId,
            },
          },
        },
        {
          model: AdvertInvolvedPartyModel,
          where: {
            id: {
              [Op.eq]: involvedPartyId,
            },
          },
        },
        AdvertAttachmentsModel,
        AdvertStatusModel,
        {
          model: AdvertTypeModel,
          attributes: ['id', 'title', 'slug'],
        },
        {
          model: AdvertCategoryModel,
          attributes: ['id', 'title', 'slug'],
          where: {
            id: {
              [Op.in]: categoryIds,
            },
          },
        },
      ],
      order: [
        [
          Sequelize.literal(`CASE
            WHEN "AdvertModel"."involved_party_id" = '${involvedPartyId}' THEN 2
            WHEN "AdvertModel"."department_id" = '${departmentId}' THEN 1
            ELSE 0 END`),
          'DESC',
        ],
      ],
      limit: limit,
    })

    const mapped = similarAdverts.map((item) => advertSimilarMigrate(item))

    return ResultWrapper.ok({
      adverts: mapped,
    })
  }

  @LogAndHandle()
  @Cacheable()
  async getAdverts(
    params?: GetAdvertsQueryParams,
  ): Promise<ResultWrapper<GetAdvertsResponse>> {
    const page = params?.page ?? 1
    const pageSize = params?.pageSize ?? DEFAULT_PAGE_SIZE
    const searchCondition = params?.search ? `%${params.search}%` : undefined

    try {
      // Check if the search is for an internal case number
      const isearchingForInternalCaseNumber = /^\d{11}$/.test(
        params?.search ?? '',
      )
      if (isearchingForInternalCaseNumber) {
        const found = await this.caseModel.findOne({
          include: [
            {
              model: AdvertModel,
              include: [
                {
                  model: AdvertTypeModel,
                  as: 'type',
                  include: [
                    {
                      model: AdvertDepartmentModel,
                    },
                  ],
                },
                AdvertDepartmentModel,
                AdvertStatusModel,
                AdvertInvolvedPartyModel,
                AdvertAttachmentsModel,
                AdvertCategoryModel,
              ],
            },
          ],
          where: {
            caseNumber: params?.search,
          },
        })

        if (!found?.advert) {
          return ResultWrapper.ok({
            adverts: [],
            paging: generatePaging([], 1, pageSize, 1),
          })
        }

        const migrated = advertMigrate(found.advert)
        const paging = generatePaging([migrated], 1, pageSize, 1)

        return ResultWrapper.ok({
          adverts: [migrated],
          paging,
        })
      }
    } catch (error) {
      // do nothing, just continue.
    }

    const whereParams = {}
    if (params?.dateFrom) {
      Object.assign(whereParams, {
        publicationDate: {
          [Op.gte]: params.dateFrom,
        },
      })
    }

    if (params?.dateTo) {
      Object.assign(whereParams, {
        publicationDate: {
          [Op.lte]: params.dateTo,
        },
      })
    }

    if (params?.dateTo && params?.dateFrom) {
      Object.assign(whereParams, {
        publicationDate: {
          [Op.between]: [params.dateFrom, params.dateTo],
        },
      })
    }

    if (params?.search) {
      Object.assign(whereParams, {
        [Op.or]: [
          {
            subject: { [Op.iLike]: searchCondition },
          },
          [
            Sequelize.where(
              Sequelize.literal(`CONCAT(serial_number, '/', publication_year)`),
              { [Op.iLike]: searchCondition },
            ),
          ],
        ],
      })
    }

    const adverts = await this.advertModel.findAndCountAll({
      distinct: true,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      where: whereParams,
      attributes: {
        include: [
          ['publication_date', 'customPublicationDate'],
          ['serial_number', 'customSerialNumber'],
        ],
      },
      include: [
        {
          model: AdvertTypeModel,
          as: 'type',
          include: [
            {
              model: AdvertDepartmentModel,
            },
          ],
          where: params?.type
            ? {
                slug: params?.type,
              }
            : undefined,
        },
        {
          model: AdvertDepartmentModel,
          where: params?.department
            ? {
                slug: params?.department,
              }
            : undefined,
        },
        AdvertStatusModel,
        {
          model: AdvertInvolvedPartyModel,
          where: params?.involvedParty
            ? {
                slug: params?.involvedParty,
              }
            : undefined,
        },
        AdvertAttachmentsModel,
        AdvertCategoryModel,
        {
          model: AdvertCategoryModel,
          where: params?.category
            ? {
                slug: params?.category,
              }
            : undefined,
        },
      ],
      order: [
        [Sequelize.literal('"customPublicationDate"'), 'DESC'],
        [Sequelize.literal('"customSerialNumber"'), 'DESC'],
      ],
    })

    const mapped = adverts.rows.map((item) => advertMigrate(item))

    const paging = generatePaging(mapped, page, pageSize, adverts.count)

    return ResultWrapper.ok({
      adverts: mapped,
      paging,
    })
  }

  @LogAndHandle()
  async uploadAdvertPDF(
    advertId: string,
    file: Express.Multer.File,
  ): Promise<ResultWrapper<S3UploadFileResponse>> {
    const advert = ResultWrapper.unwrap(await this.getAdvert(advertId)).advert
    //create advert url from
    const key = `adverts/${advert.department?.title[0]}_nr_${advert.publicationNumber?.number}_${advert.publicationNumber?.year}.pdf`
    const uploadedFile = (
      await this.s3Service.replaceAdvertPdf(key, file)
    ).unwrap()

    return ResultWrapper.ok({
      ...uploadedFile,
      url: uploadedFile.url,
      file: uploadedFile,
    })
  }
}
