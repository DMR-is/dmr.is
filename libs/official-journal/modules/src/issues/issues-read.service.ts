import { col, fn, Op, where, WhereOptions } from 'sequelize'

import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import {
  generatePaging,
  getLimitAndOffset,
} from '@dmr.is/utils-server/serverUtils'

import {
  GetMonthlyIssuesQueryDto,
  GetMonthlyIssuesResponseDto,
} from './issues.dto'
import { IssuesModel } from './issues.model'
import { IIssuesReadService } from './issues-read.service.interface'

/**
 * The paged monthly-issues read. Needs only `IssuesModel`, so the public
 * `GET /issues` does not pull in the PDF pipeline that issue generation
 * (`IssusesService`) depends on.
 */
@Injectable()
export class IssuesReadService implements IIssuesReadService {
  constructor(
    @InjectModel(IssuesModel) private readonly issuesModel: typeof IssuesModel,
  ) {}

  async getIssues(
    query: GetMonthlyIssuesQueryDto,
  ): Promise<GetMonthlyIssuesResponseDto> {
    const { limit, offset } = getLimitAndOffset({
      page: query.page,
      pageSize: query.pageSize,
    })

    const whereClause: WhereOptions<IssuesModel> = {}

    if (query.departmentId) {
      whereClause.departmentId = query.departmentId
    }

    if (query.month && query.year) {
      const month = query.month
      const year = query.year

      const monthStart = new Date(year, month - 1, 1)
      const monthEnd = new Date(year, month, 0, 23, 59, 59)

      whereClause.startDate = {
        [Op.gte]: monthStart,
        [Op.lte]: monthEnd,
      }
    } else if (query.year) {
      const year = query.year

      const yearStart = new Date(year, 0, 1)
      const yearEnd = new Date(year, 11, 31, 23, 59, 59)

      whereClause.startDate = {
        [Op.gte]: yearStart,
        [Op.lte]: yearEnd,
      }
    } else if (query.month) {
      const month = query.month
      Object.assign(whereClause, {
        [Op.and]: [where(fn('date_part', 'month', col('start_date')), month)],
      })
    }

    const issues = await this.issuesModel.findAndCountAll({
      limit,
      offset,
      where: whereClause,
    })

    const mapped = issues.rows.map((issue) => issue.fromModel())
    const paging = generatePaging(
      issues.rows,
      query.page,
      query.pageSize,
      issues.count,
    )

    return {
      issues: mapped,
      paging: paging,
    }
  }
}
