import { Op } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'
import { LogAndHandle } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  AdvertInvolvedPartyModel,
  CaseModel,
  CaseStatusEnum,
  CaseStatusModel,
} from '@dmr.is/official-journal/models'
import { DefaultSearchParams } from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'
import { generatePaging, getLimitAndOffset } from '@dmr.is/utils'

import { Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { GetCasesInProgressReponse } from './dto/get-cases-in-progress-response.dto'
import { IJournalService } from './journal.service.interface'
@Injectable()
export class JournalService implements IJournalService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,

    @InjectModel(CaseModel) private readonly caseModel: typeof CaseModel,
    private readonly sequelize: Sequelize,
  ) {}

  @LogAndHandle()
  async getCasesInProgress(
    params?: DefaultSearchParams,
  ): Promise<ResultWrapper<GetCasesInProgressReponse>> {
    const statuses = [
      CaseStatusEnum.Submitted,
      CaseStatusEnum.InProgress,
      CaseStatusEnum.InReview,
      CaseStatusEnum.ReadyForPublishing,
    ]

    const { limit, offset } = getLimitAndOffset({
      page: params?.page,
      pageSize: params?.pageSize,
    })

    const casesResult = await this.caseModel.findAndCountAll({
      limit,
      offset,
      where: params?.search
        ? {
            advertTitle: {
              [Op.iLike]: `%${params.search}%`,
            },
          }
        : undefined,
      attributes: [
        'createdAt',
        'fastTrack',
        'requestedPublicationDate',
        'advertTitle',
      ],
      include: [
        {
          model: CaseStatusModel,
          attributes: ['id', 'title', 'slug'],
          where: {
            title: {
              [Op.in]: statuses,
            },
          },
        },
        {
          model: AdvertInvolvedPartyModel,
          attributes: ['title'],
        },
      ],
      order: [['createdAt', 'DESC']],
    })

    const paging = generatePaging(
      casesResult.rows,
      params?.page,
      params?.pageSize,
      casesResult.count,
    )

    return ResultWrapper.ok({
      cases: casesResult.rows.map((c) => ({
        id: c.id,
        title: c.advertType.title + ' ' + c.advertTitle,
        status: c.status.title,
        involvedParty: c.involvedParty.title,
        fastTrack: c.fastTrack,
        createdAt: c.createdAt,
        requestedPublicationDate: c.requestedPublicationDate,
      })),
      paging: paging,
    })
  }
}
