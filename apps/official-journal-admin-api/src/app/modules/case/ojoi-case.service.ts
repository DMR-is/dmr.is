import Mail from 'nodemailer/lib/mailer'
import { Op, Transaction } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'
import { ApplicationEvent, AttachmentTypeParam } from '@dmr.is/constants'
import { LogAndHandle, Transactional } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { Case } from '@dmr.is/official-journal/dto/case/case.dto'
import { UserDto } from '@dmr.is/official-journal/dto/user/user.dto'
import { caseMigrate } from '@dmr.is/official-journal/migrations/case/case.migrate'
import {
  AdvertModel,
  AdvertStatusEnum,
  CaseModel,
  CaseStatusEnum,
  CaseStatusModel,
  DepartmentEnum,
  SignatureModel,
} from '@dmr.is/official-journal/models'
import { IAdvertService } from '@dmr.is/official-journal/modules/advert'
import { IAdvertCorrectionService } from '@dmr.is/official-journal/modules/advert-correction'
import {
  IAttachmentService,
  PostApplicationAttachmentBody,
} from '@dmr.is/official-journal/modules/attachment'
import { ICaseService } from '@dmr.is/official-journal/modules/case'
import { IPdfService } from '@dmr.is/official-journal/modules/pdf'
import { IUtilityService } from '@dmr.is/official-journal/modules/utility'
import { IApplicationService } from '@dmr.is/shared/modules/application'
import { IAWSService, PresignedUrlResponse } from '@dmr.is/shared/modules/aws'
import { ResultWrapper } from '@dmr.is/types'
import { enumMapper, getPublicationTemplate, getS3Bucket } from '@dmr.is/utils'

import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import {
  GetCasesWithDepartmentCount,
  GetCasesWithStatusCount,
} from './dto/case-with-counter.dto'
import {
  GetCasesWithDepartmentCountQuery,
  GetCasesWithStatusCountQuery,
} from './dto/get-cases-with-count-query.dto'
import {
  GetCasesWithPublicationNumber,
  GetCasesWithPublicationNumberQuery,
} from './dto/get-cases-with-publication-number.dto'
import { PostCasePublishBody } from './dto/post-publish-body.dto'
import {
  UpdateAdvertHtmlBody,
  UpdateAdvertHtmlCorrection,
} from './dto/update-advert-html-body.dto'
import { caseParameters } from './mappers/case-parameters.mapper'
import { IOfficialJournalCaseService } from './ojoi-case.service.interface'
import { getNextStatus, getPreviousStatus } from './ojoi-case.utils'
import { casesDetailedIncludes, casesIncludes } from './relations'

const LOGGING_CATEGORY = 'case-service'
const LOGGING_CONTEXT = 'CaseService'
const LOGGING_QUERY = 'CaseServiceQueryRunner'

@Injectable()
export class OfficialJournalCaseService implements IOfficialJournalCaseService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(ICaseService) private readonly caseService: ICaseService,
    @Inject(IAdvertService) private readonly advertService: IAdvertService,
    @Inject(IAWSService) private readonly s3: IAWSService,

    @Inject(IAttachmentService)
    private readonly attachmentService: IAttachmentService,
    @Inject(IPdfService)
    private readonly pdfService: IPdfService,
    @Inject(IUtilityService) private readonly utilityService: IUtilityService,
    @InjectModel(CaseModel) private readonly caseModel: typeof CaseModel,

    @Inject(IApplicationService)
    private readonly applicationService: IApplicationService,
    @Inject(IAdvertCorrectionService)
    private readonly advertCorrectionService: IAdvertCorrectionService,
    @InjectModel(AdvertModel) private readonly advertModel: typeof AdvertModel,
    @InjectModel(CaseStatusModel)
    private readonly caseStatusModel: typeof CaseStatusModel,
    private readonly sequelize: Sequelize,
  ) {
    this.logger.info('Using CaseService')
  }

  async getCasesWithPublicationNumber(
    department: DepartmentEnum,
    params: GetCasesWithPublicationNumberQuery,
  ): Promise<ResultWrapper<GetCasesWithPublicationNumber>> {
    if (!params?.id) {
      return ResultWrapper.err({
        code: 400,
        message: 'Missing required parameter id',
      })
    }

    // publication number is dependent on the signature date
    // so we take the year from the signature date and count from there
    const cases = await this.caseModel.findAll({
      benchmark: true,
      attributes: [
        'id',
        'requestedPublicationDate',
        'createdAt',
        'year',
        'advertTitle',
        'fastTrack',
        'publishedAt',
        'publicationNumber',
      ],
      include: [
        ...casesIncludes({ department: department }),
        {
          model: SignatureModel,
          attributes: ['date'],
        },
      ],
      logging: (_, timing) => {
        this.logger.info(
          `getCasesWithPublicationNumber query executed in ${timing}ms`,
          {
            context: LOGGING_QUERY,
            category: LOGGING_CATEGORY,
            query: 'getCasesWithPublicationNumber',
          },
        )
      },
    })

    if (cases.length === 0) {
      return ResultWrapper.ok({
        cases: [],
      })
    }

    // we must ensure the order of the cases is the same as passed in the params
    const sortedCases = params.id
      .map((id) => cases.find((c) => c.id === id))
      .filter((c) => c !== undefined) // this should never happen, but for typescript

    const calculateNextPublicationNumber = async () => {
      const publicationYears: number[] = []
      const migratedCases: Case[] = []
      for (const c of sortedCases) {
        const year = c.year

        const nextPublicationNumber = await this.advertModel.count({
          benchmark: true,
          distinct: true,
          where: {
            departmentId: {
              [Op.eq]: c.department.id,
            },
            [Op.and]: [
              Sequelize.where(
                Sequelize.fn(
                  'EXTRACT',
                  Sequelize.literal(`YEAR FROM "signature_date"`),
                ),
                year,
              ),
            ],
          },
          logging: (_, timing) =>
            this.logger.info(
              `getCasesWithPublicationNumber nextPublicationNumber query executed in ${timing}ms`,
              {
                context: LOGGING_QUERY,
                category: LOGGING_CATEGORY,
                query: 'getCasesWithPublicationNumber',
              },
            ),
        })

        const yearCount = publicationYears.filter((y) => y === year).length
        publicationYears.push(year)

        const mappedCase = caseMigrate(c)
        migratedCases.push({
          ...mappedCase,
          publicationNumber: `${nextPublicationNumber + yearCount + 1}`,
        })
      }

      return migratedCases
    }

    const mapped = await calculateNextPublicationNumber()

    return ResultWrapper.ok({
      cases: mapped.sort((a, b) => a.year - b.year),
    })
  }

  @LogAndHandle()
  @Transactional()
  async updateCaseNextStatus(
    caseId: string,
    _currentUser: UserDto,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    const caseLookup = await this.caseModel.findByPk(caseId, {
      attributes: [''],
      include: [
        {
          model: CaseStatusModel,
          attributes: ['id', 'title'],
        },
      ],
      transaction,
    })

    if (!caseLookup) {
      throw new NotFoundException('Case not found')
    }

    const nextStatus = getNextStatus(caseLookup.status.title)

    const statusToUpdateTo = await this.caseStatusModel.findOne({
      where: { title: nextStatus },
      transaction,
    })

    if (!statusToUpdateTo) {
      this.logger.error('Could not find status to update to', {
        category: LOGGING_CATEGORY,
        context: LOGGING_CONTEXT,
        status: caseLookup.status.title,
      })
      throw new InternalServerErrorException()
    }

    await caseLookup.update({ statusId: statusToUpdateTo.id }, { transaction })

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  @Transactional()
  async updateCasePreviousStatus(
    caseId: string,
    _currentUser: UserDto,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    const caseLookup = await this.caseModel.findByPk(caseId, {
      include: [
        {
          model: CaseStatusModel,
          attributes: ['id', 'title'],
        },
      ],
      transaction,
    })

    if (!caseLookup) {
      throw new NotFoundException('Case not found')
    }

    const previousStatus = getPreviousStatus(caseLookup.status.title)

    const statusToUpdateTo = await this.caseStatusModel.findOne({
      where: { title: previousStatus },
      transaction,
    })

    if (!statusToUpdateTo) {
      this.logger.error('Could not find status to update to', {
        category: LOGGING_CATEGORY,
        context: LOGGING_CONTEXT,
        status: caseLookup.status.title,
      })
      throw new InternalServerErrorException()
    }

    await caseLookup.update({ statusId: statusToUpdateTo.id }, { transaction })

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  @Transactional()
  async updateAdvert(
    caseId: string,
    body: UpdateAdvertHtmlCorrection,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    const { advertHtml, ...rest } = body

    const activeCase = await this.caseModel.findByPk(caseId, {
      include: [
        {
          model: AdvertModel,
          attributes: ['documentPdfUrl', 'id'],
        },
      ],
      transaction,
    })

    if (!activeCase) {
      return ResultWrapper.err({
        code: 404,
        message: 'Case not found',
      })
    }

    const now = new Date().toISOString()

    const docUrl = activeCase?.advert?.documentPdfUrl || `${caseId}_${now}.pdf` // Fallback to caseId if no url. Highly unlikely, but just in case.

    if (!activeCase?.advert?.documentPdfUrl) {
      this.logger.error(
        `Failed to get advert pdf url<${activeCase?.advertId}>, in case<${caseId}`,
        {
          caseId: caseId,
          advertId: activeCase?.advertId,
          category: LOGGING_CATEGORY,
          pdfName: docUrl,
        },
      )
    }

    const pdfUrl = docUrl.replace('.pdf', `_${now}.pdf`)

    ResultWrapper.unwrap(await this.createPdfAndUpload(caseId, pdfUrl))
    const [updateAdvertCheck, postCaseCorrectionCheck] = await Promise.all([
      this.updateAdvertByHtml(
        caseId,
        { advertHtml, documentPdfUrl: pdfUrl },
        transaction,
      ),
      this.advertCorrectionService.postCaseCorrection(
        caseId,
        {
          ...rest,
          documentHtml: advertHtml,
          documentPdfUrl: pdfUrl,
        },
        transaction,
      ),
    ])

    ResultWrapper.unwrap(updateAdvertCheck)
    ResultWrapper.unwrap(postCaseCorrectionCheck)

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  @Transactional()
  async updateAdvertByHtml(
    caseId: string,
    body: UpdateAdvertHtmlBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    const caseLookup = await this.caseModel.findByPk(caseId, {
      attributes: ['advertId'],
      transaction,
    })
    ResultWrapper.unwrap(await this.advertService.updateAdvert(caseId, body))

    if (caseLookup?.advertId) {
      ResultWrapper.unwrap(
        await this.advertService.updateAdvert(caseLookup.advertId, {
          documentHtml: body.advertHtml,
          ...(body.documentPdfUrl && { documentPdfUrl: body.documentPdfUrl }),
        }),
      )
    }

    return ResultWrapper.ok()
  }

  @LogAndHandle({ logArgs: false })
  private async createPdfAndUpload(
    caseId: string,
    fileName: string,
  ): Promise<ResultWrapper> {
    const advertPdf = await this.pdfService.generatePdfByCaseId(caseId)

    if (!advertPdf.result.ok) {
      this.logger.warn('Failed to get pdf for case', {
        error: advertPdf.result.error,
        category: LOGGING_CATEGORY,
      })
    }

    if (advertPdf.result.ok) {
      const bucket = getS3Bucket()
      const key = `adverts/${fileName}`
      const upload = await this.s3.uploadObject(
        bucket,
        key,
        fileName,
        advertPdf.result.value,
      )

      if (!upload.result.ok) {
        this.logger.warn('Failed to upload pdf to s3', {
          error: upload.result.error,
          category: LOGGING_CATEGORY,
        })
      } else {
        this.logger.debug('Uploaded pdf to s3', {
          url: upload.result.value,
          category: LOGGING_CATEGORY,
        })
      }
    }

    return ResultWrapper.ok()
  }

  @LogAndHandle({ logArgs: false })
  private async publishCase(
    caseId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    const caseToPublish = await this.caseModel.findByPk(caseId, {
      include: [...casesDetailedIncludes, { model: SignatureModel }],
    })

    if (!caseToPublish) {
      return ResultWrapper.err({
        code: 404,
        message: 'Case not found',
      })
    }

    const now = new Date()

    const serial = (
      await this.utilityService.getNextPublicationNumber(
        caseToPublish.departmentId,
        transaction,
      )
    ).unwrap()

    const signatureHtml = caseToPublish.signature.html

    const departmentPrefix = caseToPublish.department.slug
      .replace('-deild', '')
      .toUpperCase()
    const pdfFileName = `${departmentPrefix}_nr_${serial}_${caseToPublish.year}.pdf`

    await this.createPdfAndUpload(caseId, pdfFileName)

    const publicationHtml = getPublicationTemplate(
      caseToPublish.department.title,
      now,
    )

    const advertCreateResult = await this.advertService.create(
      {
        departmentId: caseToPublish.departmentId,
        typeId: caseToPublish.advertTypeId,
        involvedPartyId: caseToPublish.involvedParty.id,
        subject: caseToPublish.advertTitle,
        serial: serial,
        categories: caseToPublish.categories?.map((c) => c.id) ?? [],
        publicationDate: now.toISOString(),
        signatureDate: caseToPublish.signature.signatureDate,
        content: caseToPublish.html + signatureHtml + publicationHtml,
        pdfUrl: pdfFileName,
      },
      transaction,
    )

    if (!advertCreateResult.result.ok) {
      this.logger.error('Failed to create advert', {
        error: advertCreateResult.result.error,
        category: LOGGING_CATEGORY,
      })
      return ResultWrapper.err({
        code: 500,
        message: 'Failed to create advert',
      })
    }

    // TODO: FIX
    // await caseToPublish.update(
    //   {
    //     publicationNumber: serial,
    //     advertId: advertCreateResult.result.value.advert.id,
    //     statusId: caseStatus.id,
    //     publishedAt: now.toISOString(),
    //     updatedAt: now.toISOString(),
    //   },
    //   {
    //     where: {
    //       id: caseId,
    //     },
    //     transaction: transaction,
    //   },
    // )

    const emails = caseToPublish?.channels?.flatMap((item) => {
      if (!item.email) {
        return []
      }
      return [item.email]
    })

    const message: Mail.Options = {
      from: `Stjórnartíðindi <noreply@stjornartidindi.is>`,
      to: emails?.join(','),
      replyTo: 'noreply@stjornartidindi.is',
      subject: `Mál ${caseToPublish?.caseNumber} - ${caseToPublish?.advertType.title} ${caseToPublish?.advertTitle} hefur verið útgefið`,
      text: `Mál ${caseToPublish?.caseNumber} hefur verið útgefið`,
      html: `<h2>Mál ${caseToPublish?.caseNumber} - ${caseToPublish?.advertType.title} ${caseToPublish?.advertTitle} hefur verið útgefið</h2><p><a href="https://island.is/stjornartidindi/nr/${caseToPublish?.id}" target="_blank">Skoða auglýsingu</a></p>`,
    }

    if (caseToPublish.applicationId) {
      await this.applicationService.submitApplication(
        caseToPublish.applicationId,
        ApplicationEvent.Approve,
      )
    }
    await this.s3.sendMail(message)
    return ResultWrapper.ok()
  }

  @LogAndHandle()
  async getCasesWithStatusCount(
    status: CaseStatusEnum,
    params: GetCasesWithStatusCountQuery,
  ): Promise<ResultWrapper<GetCasesWithStatusCount>> {
    const statusesToBeCounted = params?.statuses ?? [
      CaseStatusEnum.Submitted,
      CaseStatusEnum.InProgress,
      CaseStatusEnum.InReview,
      CaseStatusEnum.ReadyForPublishing,
      CaseStatusEnum.Published,
      CaseStatusEnum.Unpublished,
      CaseStatusEnum.Rejected,
    ]

    const whereParams = caseParameters(params)

    const counterResults = statusesToBeCounted.map((statusToBeCounted) => {
      return this.caseModel.count({
        distinct: true,
        benchmark: true,
        where: whereParams,
        include: casesIncludes({
          department: params?.department,
          type: params?.type,
          status: statusToBeCounted,
          institution: params?.institution,
          category: params?.category,
        }),
        logging: (_, timing) => {
          this.logger.info(
            `getCasesWithStatusCount counter for status ${statusToBeCounted} query executed in ${timing}ms`,
            {
              context: LOGGING_QUERY,
              category: LOGGING_CATEGORY,
              query: 'getCasesWithStatusCount',
            },
          )
        },
      })
    })

    const counter = (await Promise.all(counterResults)).map((count, index) => ({
      title: statusesToBeCounted[index],
      count: count,
    }))

    const { cases, paging } = ResultWrapper.unwrap(
      await this.caseService.getCases({ ...params, status: [status] }),
    )

    return ResultWrapper.ok({
      statuses: counter.map((c) => ({
        status: c.title,
        count: c.count,
      })),
      cases,
      paging,
    })
  }

  @LogAndHandle()
  @Transactional()
  async rejectCase(caseId: string): Promise<ResultWrapper> {
    const caseStatusPromise = this.utilityService.caseStatusLookup(
      CaseStatusEnum.Rejected,
    )
    const statusLookupPromise = this.utilityService.advertStatusLookup(
      AdvertStatusEnum.Rejected,
    )
    const caseLookupPromise = this.caseModel.findByPk(caseId, {
      attributes: ['id', 'advertId', 'applicationId'],
    })

    const [caseStatusResults, statusLookupResults, caseLookup] =
      await Promise.all([
        caseStatusPromise,
        statusLookupPromise,
        caseLookupPromise,
      ])

    const caseStatus = caseStatusResults.unwrap()
    const statusLookup = statusLookupResults.unwrap()

    if (!caseLookup) {
      throw new NotFoundException(`Case<${caseId}> not found`)
    }

    await caseLookup.update({
      statusId: caseStatus.id,
    })

    if (caseLookup.advertId) {
      ResultWrapper.unwrap(
        await this.advertService.updateAdvert(caseLookup.advertId, {
          statusId: statusLookup.id,
        }),
      )
    }

    if (caseLookup.applicationId) {
      await this.applicationService.submitApplication(
        caseLookup.applicationId,
        ApplicationEvent.Reject,
      )
    }

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  async getCasesWithDepartmentCount(
    department: DepartmentEnum,
    params: GetCasesWithDepartmentCountQuery,
  ): Promise<ResultWrapper<GetCasesWithDepartmentCount>> {
    const whereParams = caseParameters(params)

    const departmentsToCount = [
      DepartmentEnum.A,
      DepartmentEnum.B,
      DepartmentEnum.C,
    ]

    const [counterA, counterB, counterC] = departmentsToCount.map(
      (department) => {
        return this.caseModel.count({
          distinct: true,
          benchmark: true,
          where: whereParams,
          include: casesIncludes({
            department: department,
            type: params?.type,
            status: params?.status,
            institution: params?.institution,
            category: params?.category,
          }),
          logging: (_, timing) =>
            this.logger.info(
              `getCasesWithDepartmentCount ${department} counter query ran in ${timing}ms`,
              {
                context: LOGGING_QUERY,
                category: LOGGING_CATEGORY,
                query: 'getCasesWithDepartmentCount',
              },
            ),
        })
      },
    )

    const [...counters] = await Promise.all([counterA, counterB, counterC])

    const counterResults = counters.map((counter, index) => ({
      department: departmentsToCount[index],
      count: counter,
    }))

    const { cases, paging } = ResultWrapper.unwrap(
      await this.caseService.getCases(params),
    )

    return ResultWrapper.ok({
      departments: counterResults,
      cases,
      paging,
    })
  }

  private async processCaseToPublish(
    ids: string[],
    transaction?: Transaction,
  ): Promise<ResultWrapper<undefined>> {
    for (const id of ids) {
      this.logger.debug(`Publishing case<${id}>`, {
        id: id,
        category: LOGGING_CATEGORY,
      })
      await this.publishCase(id, transaction)
    }

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  @Transactional()
  async publishCases(
    body: PostCasePublishBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper<undefined>> {
    const { caseIds } = body

    if (!caseIds || !caseIds.length) {
      throw new BadRequestException()
    }

    return await this.processCaseToPublish(caseIds, transaction)
  }

  @LogAndHandle()
  @Transactional()
  async getCaseAttachment(
    caseId: string,
    attachmentId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<PresignedUrlResponse>> {
    const { attachment } = (
      await this.attachmentService.getCaseAttachment(
        caseId,
        attachmentId,
        transaction,
      )
    ).unwrap()

    const signedUrl = (
      await this.s3.getObject(attachment.fileLocation)
    ).unwrap()

    return Promise.resolve(ResultWrapper.ok({ url: signedUrl }))
  }

  @LogAndHandle()
  @Transactional()
  async overwriteCaseAttachment(
    caseId: string,
    attachmentId: string,
    incomingAttachment: PostApplicationAttachmentBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper<PresignedUrlResponse>> {
    // fetch the presigned url for the new attachment

    const signedUrl = (
      await this.s3.getPresignedUrl(incomingAttachment.fileLocation)
    ).unwrap()

    // fetch the old attachment
    const { attachment } = (
      await this.attachmentService.getCaseAttachment(
        caseId,
        attachmentId,
        transaction,
      )
    ).unwrap()

    // mark the old attachment as deleted
    ResultWrapper.unwrap(
      await this.attachmentService.deleteAttachmentByKey(
        attachment.applicationId,
        attachment.fileLocation,
        transaction,
      ),
    )

    const attachmentType = enumMapper(attachment.type.slug, AttachmentTypeParam)

    if (!attachmentType) {
      throw new BadRequestException('Invalid attachment type')
    }

    // create the new attachment
    ResultWrapper.unwrap(
      await this.attachmentService.createAttachment({
        params: {
          caseId,
          applicationId: attachment.applicationId,
          attachmentType: attachmentType,
          body: incomingAttachment,
        },
        transaction,
      }),
    )

    // return the presigned url for the client to upload the new attachment
    return ResultWrapper.ok({ url: signedUrl.url })
  }

  @LogAndHandle()
  @Transactional()
  async uploadAttachments(
    key: string,
  ): Promise<ResultWrapper<PresignedUrlResponse>> {
    const signedUrl = (await this.s3.getPresignedUrl(key)).unwrap()

    return Promise.resolve(ResultWrapper.ok({ url: signedUrl.url }))
  }
}
