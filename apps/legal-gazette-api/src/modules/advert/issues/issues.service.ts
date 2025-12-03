import endOfDay from 'date-fns/endOfDay'
import startOfDay from 'date-fns/startOfDay'
import { Op, WhereOptions } from 'sequelize'

import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { generatePaging, getLimitAndOffset } from '@dmr.is/utils'

import {
  GetIssuesDto,
  GetIssuesQuery,
  IssueModel,
} from '../../../models/issues.model'
import { IIssuesService } from './issues.service.interface'

@Injectable()
export class IssuesService implements IIssuesService {
  constructor(
    @InjectModel(IssueModel) private readonly issueModel: typeof IssueModel,
  ) {}

  async getAllPublishedIssues(q: GetIssuesQuery): Promise<GetIssuesDto> {
    const { limit, offset } = getLimitAndOffset({
      page: q.page,
      pageSize: q.pageSize,
    })

    const whereParams: WhereOptions = {}
    if (q?.dateFrom) {
      Object.assign(whereParams, {
        publicationDate: {
          [Op.gte]: startOfDay(new Date(q.dateFrom)),
        },
      })
    }

    if (q?.dateTo) {
      Object.assign(whereParams, {
        publicationDate: {
          [Op.lte]: endOfDay(new Date(q.dateTo)),
        },
      })
    }

    if (q?.year) {
      Object.assign(whereParams, {
        publicationYear: {
          [Op.eq]: q.year,
        },
      })
    }

    if (q?.dateTo && q?.dateFrom) {
      Object.assign(whereParams, {
        publicationDate: {
          [Op.between]: [
            startOfDay(new Date(q.dateFrom)),
            endOfDay(new Date(q.dateTo)),
          ],
        },
      })
    }

    const issues = await this.issueModel.findAndCountAll({
      where: whereParams,
      order: [['issue', 'ASC']],
      limit,
      offset,
    })

    const migrated = issues.rows.map((issue) => issue.fromModel())

    const paging = generatePaging(migrated, q.page, q.pageSize, issues.count)
    return {
      issues: migrated,
      paging,
    }
  }
}
