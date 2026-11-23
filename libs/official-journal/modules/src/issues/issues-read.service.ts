import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { findIssues } from './find-issues.query'
import {
  GetMonthlyIssuesQueryDto,
  GetMonthlyIssuesResponseDto,
} from './issues.dto'
import { IssuesModel } from './issues.model'

export interface IIssuesReadService {
  getIssues(
    query: GetMonthlyIssuesQueryDto,
  ): Promise<GetMonthlyIssuesResponseDto>
}

export const IIssuesReadService = Symbol('IIssuesReadService')

@Injectable()
export class IssuesReadService implements IIssuesReadService {
  constructor(
    @InjectModel(IssuesModel) private readonly issuesModel: typeof IssuesModel,
  ) {}

  getIssues(
    query: GetMonthlyIssuesQueryDto,
  ): Promise<GetMonthlyIssuesResponseDto> {
    return findIssues(this.issuesModel, query)
  }
}
