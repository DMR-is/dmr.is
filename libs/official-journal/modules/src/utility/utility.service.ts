import { Op, Transaction } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'

import { Inject, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { ApplicationEvent } from '@dmr.is/constants'
import { LogAndHandle, Transactional } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { ALL_MOCK_USERS } from '@dmr.is/mocks'
import {
  GetApplicationResponse,
  GetInstitutionsFullResponse,
} from '@dmr.is/shared-dto'
import { GenericError, ResultWrapper } from '@dmr.is/types'

import { AdvertTypeModel } from '../advert-type/models'
import { IApplicationService } from '../application/application.service.interface'
import {
  ApplicationAttachmentModel,
  ApplicationAttachmentTypeModel,
} from '../attachments/models'
import {
  CaseAdditionModel,
  CaseCommunicationStatusModel,
  CaseModel,
  CaseStatusModel,
  CaseTagModel,
} from '../case/models'
import { CaseCategoriesModel } from '../case/models/case-categories.model'
import { casesDetailedIncludes } from '../case/relations'
import { advertInvolvedPartyMigrate } from '../journal/migrations'
import {
  AdvertCategoryModel,
  AdvertCorrectionModel,
  AdvertDepartmentModel,
  AdvertInvolvedPartyModel,
  AdvertModel,
  AdvertStatusModel,
} from '../journal/models'
import { SignatureModel } from '../signature/models/signature.model'
import { SignatureMemberModel } from '../signature/models/signature-member.model'
import { SignatureRecordModel } from '../signature/models/signature-record.model'
import { IUtilityService } from './utility.service.interface'

export class UtilityService implements IUtilityService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,

    @Inject(IApplicationService)
    private applicationService: IApplicationService,
    @InjectModel(AdvertModel) private advertModel: typeof AdvertModel,
    @InjectModel(CaseModel) private caseModel: typeof CaseModel,
    @InjectModel(AdvertDepartmentModel)
    private departmentModel: typeof AdvertDepartmentModel,
    @InjectModel(AdvertTypeModel)
    private typeModel: typeof AdvertTypeModel,
    @InjectModel(AdvertCategoryModel)
    private categoryModel: typeof AdvertCategoryModel,

    @InjectModel(CaseStatusModel)
    private caseStatusModel: typeof CaseStatusModel,

    @InjectModel(CaseTagModel) private caseTagModel: typeof CaseTagModel,
    @InjectModel(CaseCommunicationStatusModel)
    private caseCommunicationStatusModel: typeof CaseCommunicationStatusModel,
    @InjectModel(CaseCategoriesModel)
    private caseCategoriesModel: typeof CaseCategoriesModel,

    @InjectModel(AdvertInvolvedPartyModel)
    private advertInvolvedPartyModel: typeof AdvertInvolvedPartyModel,

    @InjectModel(AdvertStatusModel)
    private advertStatusModel: typeof AdvertStatusModel,
    private sequelize: Sequelize,
  ) {
    this.logger.info('Using UtilityService')
  }
  async institutionLookup(
    institutionId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<AdvertInvolvedPartyModel>> {
    const institution = await this.advertInvolvedPartyModel.findByPk(
      institutionId,
      {
        transaction,
      },
    )

    if (!institution) {
      throw new NotFoundException(`Institution<${institutionId}> not found`)
    }

    return ResultWrapper.ok(institution)
  }

  @LogAndHandle()
  async getInstitutionsByNationalId(
    nationalId: string,
  ): Promise<ResultWrapper<GetInstitutionsFullResponse>> {
    const parties = await this.advertInvolvedPartyModel.findAndCountAll({
      distinct: true,
      order: [['title', 'ASC']],
      where: {
        nationalId: nationalId,
      },
    })

    const mapped = parties.rows.map((item) => advertInvolvedPartyMigrate(item))
    return ResultWrapper.ok({
      institutions: mapped,
    })
  }

  @LogAndHandle()
  async getCaseInvolvedPartyByApplicationId(
    applicationId: string,
  ): Promise<ResultWrapper<{ involvedPartyId: string }>> {
    const found = await this.caseModel.findOne({
      attributes: ['involvedPartyId'],
      where: {
        applicationId: applicationId,
      },
    })

    if (!found) {
      return ResultWrapper.err({
        code: 404,
        message: `Case with applicationId<${applicationId}> not found`,
      })
    }

    return ResultWrapper.ok({ involvedPartyId: found.involvedPartyId })
  }

  @LogAndHandle()
  async approveApplication(applicationId: string): Promise<ResultWrapper> {
    ResultWrapper.unwrap(
      await this.applicationService.submitApplication(
        applicationId,
        ApplicationEvent.Approve,
      ),
    )
    return ResultWrapper.ok()
  }

  @LogAndHandle()
  async rejectApplication(
    applicationId: string,
  ): Promise<ResultWrapper<unknown, GenericError>> {
    ResultWrapper.unwrap(
      await this.applicationService.submitApplication(
        applicationId,
        ApplicationEvent.Reject,
      ),
    )
    return ResultWrapper.ok()
  }

  @LogAndHandle()
  editApplication(applicationId: string): Promise<ResultWrapper> {
    return this.applicationService.submitApplication(
      applicationId,
      ApplicationEvent.Edit,
    )
  }

  @LogAndHandle()
  async applicationLookup(
    applicationId: string,
  ): Promise<ResultWrapper<GetApplicationResponse>> {
    const application = (
      await this.applicationService.getApplication(applicationId)
    ).unwrap()

    return ResultWrapper.ok(application)
  }

  @LogAndHandle({ logArgs: false })
  @Transactional()
  async getNextPublicationNumber(
    departmentId: string,
    signatureYear?: number,
    transaction?: Transaction,
  ): Promise<ResultWrapper<number>> {
    const year = signatureYear ?? new Date().getFullYear()

    const maxSerial: number | null = await this.advertModel.max(
      'serialNumber',
      {
        where: {
          departmentId: {
            [Op.eq]: departmentId,
          },
          publicationYear: {
            [Op.eq]: year,
          },
        },
        transaction,
      },
    )

    return ResultWrapper.ok((maxSerial ?? 0) + 1)
  }

  @LogAndHandle()
  @Transactional()
  async categoryLookup(
    categoryId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<AdvertCategoryModel>> {
    const categoryLookup = await this.categoryModel.findByPk(categoryId, {
      transaction,
    })

    if (!categoryLookup) {
      throw new NotFoundException(`Category<${categoryId}> not found`)
    }

    return ResultWrapper.ok(categoryLookup)
  }

  @LogAndHandle()
  @Transactional()
  async categoriesLookup(
    categoryIds: string[],
    transaction?: Transaction,
  ): Promise<ResultWrapper<AdvertCategoryModel[]>> {
    const categories = await this.categoryModel.findAll({
      where: {
        id: {
          [Op.in]: categoryIds,
        },
      },
      transaction: transaction,
    })

    return ResultWrapper.ok(categories)
  }

  @LogAndHandle()
  @Transactional()
  async advertStatusLookup(
    status: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<AdvertStatusModel>> {
    const statusLookup = await this.advertStatusModel.findOne({
      where: {
        title: status,
      },
      transaction,
    })

    if (!statusLookup) {
      throw new NotFoundException(`Status<${status}> not found`)
    }

    return ResultWrapper.ok(statusLookup)
  }

  @LogAndHandle()
  @Transactional()
  async typeLookup(
    type: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<AdvertTypeModel>> {
    const typeLookup = await this.typeModel.findByPk(type, {
      include: [AdvertDepartmentModel],
      transaction,
    })

    if (!typeLookup) {
      throw new NotFoundException(`Type<${type}> not found`)
    }

    return ResultWrapper.ok(typeLookup)
  }

  @LogAndHandle()
  async userLookup(userId: string): Promise<ResultWrapper> {
    const userLookup = ALL_MOCK_USERS.find((u) => u.id === userId)

    if (!userLookup) {
      throw new NotFoundException(`User<${userId}> not found`)
    }

    return ResultWrapper.ok(userLookup)
  }

  @LogAndHandle()
  @Transactional()
  async getNextCaseNumber(
    departmentId: string,
    publicationYear: number,
    transaction?: Transaction,
  ): Promise<ResultWrapper<number>> {
    const serialNumber: number | null = await this.advertModel.max(
      'serialNumber',
      {
        where: {
          departmentId,
          publicationYear,
        },
        transaction,
      },
    )

    return ResultWrapper.ok(serialNumber ? serialNumber + 1 : 1)
  }

  @LogAndHandle()
  @Transactional()
  async departmentLookup(
    departmentId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<AdvertDepartmentModel>> {
    const departmentLookup = await this.departmentModel.findByPk(departmentId, {
      transaction,
    })

    if (!departmentLookup) {
      throw new NotFoundException(`Department<${departmentId}> not found`)
    }

    return ResultWrapper.ok(departmentLookup)
  }

  @LogAndHandle()
  @Transactional()
  async caseCommunicationStatusLookup(
    status: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<CaseCommunicationStatusModel>> {
    const statusLookup = await this.caseCommunicationStatusModel.findOne({
      where: {
        title: status,
      },
      transaction,
    })

    if (!statusLookup) {
      throw new NotFoundException(`CommunicationStatus<${status}> not found`)
    }

    return ResultWrapper.ok(statusLookup)
  }

  @LogAndHandle()
  @Transactional()
  async caseCommunicationStatusLookupById(
    id: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<CaseCommunicationStatusModel>> {
    const statusLookup = await this.caseCommunicationStatusModel.findByPk(id, {
      transaction,
    })

    if (!statusLookup) {
      throw new NotFoundException(`CommunicationStatus<${id}> not found`)
    }

    return ResultWrapper.ok(statusLookup)
  }

  @LogAndHandle()
  @Transactional()
  async caseTagLookup(
    tag: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<CaseTagModel>> {
    const tagLookup = await this.caseTagModel.findOne({
      where: {
        title: tag,
      },
      transaction,
    })

    if (!tagLookup) {
      throw new NotFoundException(`Tag<${tag}> not found`)
    }

    return ResultWrapper.ok(tagLookup)
  }
  @LogAndHandle()
  @Transactional()
  async caseStatusLookup(
    status: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<CaseStatusModel>> {
    const statusLookup = await this.caseStatusModel.findOne({
      where: {
        title: status,
      },
      transaction,
    })

    if (!statusLookup) {
      return ResultWrapper.err({
        code: 404,
        message: `Status<${status}> not found`,
      })
    }

    return ResultWrapper.ok(statusLookup)
  }

  @LogAndHandle()
  @Transactional()
  async generateInternalCaseNumber(
    transaction?: Transaction,
  ): Promise<ResultWrapper<{ internalCaseNumber: string }>> {
    const now = new Date().toISOString()
    const [year, month, date] = now.split('T')[0].split('-')

    const caseCount = await this.caseModel.count({
      where: {
        createdAt: {
          [Op.between]: [`${year}-${month}-${date} 00:00:00`, now],
        },
      },
      transaction,
    })

    const count = caseCount + 1

    const withLeadingZeros =
      count < 10 ? `00${count}` : count < 100 ? `0${count}` : count

    const caseNumber = `${year}${month}${date}${withLeadingZeros}`

    return ResultWrapper.ok({ internalCaseNumber: caseNumber })
  }

  @LogAndHandle()
  @Transactional()
  async updateSignatureDateDisplay(
    caseId: string,
    hide: boolean,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    const caseRecord = await this.caseModel.findByPk(caseId, { transaction })

    if (!caseRecord) {
      throw new NotFoundException(`Case<${caseId}> not found`)
    }

    await caseRecord.update({ hideSignatureDate: hide }, { transaction })

    // If an advert exists for this case, update that too
    if (caseRecord.advertId) {
      await this.advertModel.update(
        { hideSignatureDate: hide },
        {
          where: { id: caseRecord.advertId },
          transaction,
        },
      )
    }

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  @Transactional()
  async caseLookupByApplicationId(
    applicationId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<CaseModel>> {
    const found = await this.caseModel.findOne({
      where: {
        applicationId: applicationId,
      },
      include: [
        ...casesDetailedIncludes,
        {
          model: SignatureModel,
        },
      ],

      transaction,
    })

    if (!found) {
      throw new NotFoundException(
        `Case with applicationId<${applicationId}> not found`,
      )
    }

    return ResultWrapper.ok(found)
  }

  @LogAndHandle()
  @Transactional()
  async caseLookup(
    caseId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<CaseModel>> {
    const found = await this.caseModel.findByPk(caseId, {
      include: [
        ...casesDetailedIncludes,
        {
          model: AdvertModel,
          include: [AdvertCorrectionModel],
        },
        {
          model: AdvertDepartmentModel,
        },
        {
          model: AdvertTypeModel,
        },
        {
          model: AdvertCategoryModel,
        },
        {
          model: CaseAdditionModel,
        },
        {
          model: ApplicationAttachmentModel,
          where: {
            deleted: false,
          },
          required: false,
          include: [ApplicationAttachmentTypeModel],
        },
        {
          model: SignatureModel,
          include: [
            AdvertInvolvedPartyModel,
            {
              model: SignatureRecordModel,
              as: 'records',
              separate: true,
              include: [
                {
                  model: SignatureMemberModel,
                  as: 'chairman',
                },
                {
                  model: SignatureMemberModel,
                  as: 'members',
                  separate: true,
                  required: false,
                  include: [
                    {
                      model: SignatureRecordModel,
                      required: false,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      transaction,
    })

    if (!found) {
      throw new NotFoundException(`Case<${caseId}> not found`)
    }

    return new ResultWrapper({
      ok: true,
      value: found,
    })
  }

  @LogAndHandle()
  @Transactional()
  async getAdvertCategoryIds(
    advertId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<string[]>> {
    const advert = await this.advertModel.findOne({
      include: [
        {
          model: AdvertCategoryModel,
        },
      ],
      where: {
        id: advertId,
      },
      transaction,
    })

    if (!advert || !advert.categories) {
      return ResultWrapper.ok([])
    }

    const found = advert.categories.map((cat) => cat.id)

    return ResultWrapper.ok(found)
  }
}
