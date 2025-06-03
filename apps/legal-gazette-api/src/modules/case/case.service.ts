import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { generatePaging, getLimitAndOffset } from '@dmr.is/utils'

import { CaseDto, CaseQueryDto, GetCasesDto } from './dto/case.dto'
import { caseMigrate } from './dto/case.migrate'
import { CaseModel } from './case.model'
import { ICaseService } from './case.service.interface'

@Injectable()
export class CaseService implements ICaseService {
  constructor(
    @InjectModel(CaseModel) private readonly caseModel: typeof CaseModel,
  ) {}
  async getCases(query: CaseQueryDto): Promise<GetCasesDto> {
    const { limit, offset } = getLimitAndOffset({
      page: query.page,
      pageSize: query.pageSize,
    })

    const { rows, count } = await this.caseModel.findAndCountAll({
      limit,
      offset,
    })

    const migrated = rows.map((model) => caseMigrate(model))

    const paging = generatePaging(migrated, query.page, query.pageSize, count)

    return {
      cases: migrated,
      paging,
    }
  }
  async getCase(id: string): Promise<CaseDto> {
    const caseModel = await this.caseModel.findByPk(id)

    if (!caseModel) {
      throw new NotFoundException(`Case with id ${id} not found`)
    }

    const migrated = caseMigrate(caseModel)

    return migrated
  }
}
