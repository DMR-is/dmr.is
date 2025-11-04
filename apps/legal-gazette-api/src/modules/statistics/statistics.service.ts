import { Op } from 'sequelize'

import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { AdvertModel } from '../advert/advert.model'
import { AdvertPublicationModel } from '../advert-publications/advert-publication.model'
import { CommentModel, CommentTypeEnum } from '../comment/comment.model'
import { StatusIdEnum } from '../status/status.model'
import {
  GetAdvertsInProgressStatsDto,
  GetAdvertsToBePublishedStatsDto,
  GetCountByStatusesDto,
} from './dto/statistics.dto'
import { IStatisticsService } from './statistics.service.interface'

@Injectable()
export class StatisticsService implements IStatisticsService {
  constructor(
    @InjectModel(AdvertModel) private readonly advertModel: typeof AdvertModel,
    @InjectModel(CommentModel)
    private readonly commentModel: typeof CommentModel,
  ) {}

  async getCountByStatuses(): Promise<GetCountByStatusesDto> {
    const submittedCountPromise = this.advertModel.unscoped().count({
      attributes: ['statusId'],
      where: { statusId: StatusIdEnum.SUBMITTED },
      group: ['statusId'],
    })

    const inprogressCountPromise = this.advertModel.unscoped().count({
      attributes: ['statusId'],
      where: { statusId: StatusIdEnum.IN_PROGRESS },
      group: ['statusId'],
    })

    const tobePublishedCountPromise = this.advertModel.unscoped().count({
      attributes: ['statusId'],
      where: { statusId: StatusIdEnum.READY_FOR_PUBLICATION },
      group: ['statusId'],
    })

    const [submittedCount, inprogressCount, tobePublishedCount] =
      await Promise.all([
        submittedCountPromise,
        inprogressCountPromise,
        tobePublishedCountPromise,
      ])

    return {
      submittedCount: submittedCount.reduce((acc, curr) => acc + curr.count, 0),
      inprogressCount: inprogressCount.reduce(
        (acc, curr) => acc + curr.count,
        0,
      ),
      tobePublishedCount: tobePublishedCount.reduce(
        (acc, curr) => acc + curr.count,
        0,
      ),
    }
  }
  async getAdvertsInProgressStats(): Promise<GetAdvertsInProgressStatsDto> {
    const submittedTodayCountPromise = this.advertModel.unscoped().count({
      attributes: ['statusId', 'createdAt'],
      where: {
        statusId: StatusIdEnum.SUBMITTED,
        createdAt: {
          [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
      group: ['statusId', 'createdAt'],
    })

    const totalInProgressCountPromise = this.advertModel.unscoped().count({
      attributes: ['statusId'],
      where: { statusId: StatusIdEnum.IN_PROGRESS },
      group: ['statusId'],
    })

    const unassignedCountPromise = this.advertModel.unscoped().count({
      attributes: ['statusId'],
      where: {
        statusId: {
          [Op.in]: [StatusIdEnum.SUBMITTED, StatusIdEnum.IN_PROGRESS],
        },
        assignedUserId: null,
      },
      group: ['statusId'],
    })

    const withCommentsCountPromise = this.commentModel.unscoped().count({
      attributes: ['type'],
      where: { type: CommentTypeEnum.COMMENT },
      include: [
        {
          required: true,
          model: AdvertModel.unscoped(),
          attributes: ['id', 'statusId'],
          where: {
            statusId: {
              [Op.in]: [
                StatusIdEnum.SUBMITTED,
                StatusIdEnum.IN_PROGRESS,
                StatusIdEnum.READY_FOR_PUBLICATION,
              ],
            },
          },
        },
      ],
      group: ['type'],
    })

    const [
      submittedTodayCount,
      totalInProgressCount,
      unassignedCount,
      withCommentsCount,
    ] = await Promise.all([
      submittedTodayCountPromise,
      totalInProgressCountPromise,
      unassignedCountPromise,
      withCommentsCountPromise,
    ])

    return {
      submittedTodayCount: submittedTodayCount.reduce(
        (acc, curr) => acc + curr.count,
        0,
      ),
      totalInProgressCount: totalInProgressCount.reduce(
        (acc, curr) => acc + curr.count,
        0,
      ),
      unassignedCount: unassignedCount.reduce(
        (acc, curr) => acc + curr.count,
        0,
      ),
      withCommentsCount: withCommentsCount.reduce(
        (acc, curr) => acc + curr.count,
        0,
      ),
    }
  }

  async getAdvertsToBePublishedStats(): Promise<GetAdvertsToBePublishedStatsDto> {
    const tobePublishedTodayCountPromise = this.advertModel.unscoped().count({
      attributes: ['statusId'],
      where: {
        statusId: StatusIdEnum.READY_FOR_PUBLICATION,
      },
      include: [
        {
          required: true,
          model: AdvertPublicationModel.unscoped(),
          attributes: ['scheduledAt'],
          where: {
            publishedAt: null,
            scheduledAt: {
              [Op.between]: {
                [Op.gt]: new Date(new Date().setHours(0, 0, 0, 0)),
                [Op.lt]: new Date(new Date().setHours(23, 59, 59, 999)),
              },
            },
          },
        },
      ],
      group: ['statusId'],
    })

    const pastDueCountPromise = this.advertModel.unscoped().count({
      attributes: ['statusId'],
      where: {
        statusId: StatusIdEnum.READY_FOR_PUBLICATION,
      },
      include: [
        {
          required: true,
          model: AdvertPublicationModel.unscoped(),
          attributes: ['scheduledAt'],
          where: {
            publishedAt: null,
            scheduledAt: {
              [Op.lt]: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        },
      ],
      group: ['statusId'],
    })

    const [tobePublishedTodayCount, pastDueCount] = await Promise.all([
      tobePublishedTodayCountPromise,
      pastDueCountPromise,
    ])

    return {
      pastDueCount: pastDueCount.reduce((acc, curr) => acc + curr.count, 0),
      tobePublishedTodayCount: tobePublishedTodayCount.reduce(
        (acc, curr) => acc + curr.count,
        0,
      ),
    }
  }
}
