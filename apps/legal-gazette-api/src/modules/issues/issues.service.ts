import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { GetIssuesDto } from './dto/issues.dto'
import { IssueModel } from './issues.model'
import { IIssuesService } from './issues.service.interface'

@Injectable()
export class IssuesService implements IIssuesService {
  constructor(
    @InjectModel(IssueModel) private readonly issueModel: typeof IssueModel,
  ) {}

  async getAllIssuesByYear(year: string): Promise<GetIssuesDto> {
    const issues = await this.issueModel.findAll({
      where: {
        year,
      },
      order: [['issue', 'ASC']],
    })
    return {
      issues: issues.map((issue) => issue.fromModel()),
    }
  }
}
