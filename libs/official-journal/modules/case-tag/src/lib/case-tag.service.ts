import { caseTagMigrate } from '@dmr.is/official-journal/migrations/case-tag/case-tag.migrate'
import { CaseTagModel } from '@dmr.is/official-journal/models'
import { ResultWrapper } from '@dmr.is/types'

import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { GetTagsResponse } from './dto/case-tag.dto'
import { ICaseTagService } from './case-tag.service.interface'

@Injectable()
export class CaseTagService implements ICaseTagService {
  constructor(
    @InjectModel(CaseTagModel) private caseTagModel: typeof CaseTagModel,
  ) {}

  async getTags(): Promise<ResultWrapper<GetTagsResponse>> {
    const tags = await this.caseTagModel.findAll()

    const migrated = tags.map((tag) => caseTagMigrate(tag))

    return ResultWrapper.ok({
      tags: migrated,
    })
  }
}
