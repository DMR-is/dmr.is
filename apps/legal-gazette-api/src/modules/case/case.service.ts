import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { generatePaging, getLimitAndOffset } from '@dmr.is/utils'

import {
  CaseDetailedDto,
  CaseDto,
  CaseQueryDto,
  CreateCaseDto,
  GetCasesDto,
} from './dto/case.dto'
import { CaseModel } from './case.model'
import { ICaseService } from './case.service.interface'

@Injectable()
export class CaseService implements ICaseService {
  constructor(
    @InjectModel(CaseModel) private readonly caseModel: typeof CaseModel,
  ) {}

  async restoreCase(id: string): Promise<CaseDto> {
    await this.caseModel.restore({ where: { id } })

    return this.getCase(id)
  }

  async createCase(body: CreateCaseDto): Promise<CaseDto> {
    const newCase = await this.caseModel.create(
      {
        involvedPartyNationalId: body.involvedPartyNationalId,
      },
      {
        returning: true,
      },
    )

    return newCase.fromModel()
  }

  async deleteCase(id: string): Promise<void> {
    await this.caseModel.destroy({ where: { id }, individualHooks: true })
  }

  async getCases(query: CaseQueryDto): Promise<GetCasesDto> {
    const { limit, offset } = getLimitAndOffset({
      page: query.page,
      pageSize: query.pageSize,
    })

    const { rows, count } = await this.caseModel.findAndCountAll({
      limit,
      offset,
    })

    const migrated = rows.map((model) => model.fromModel())

    const paging = generatePaging(migrated, query.page, query.pageSize, count)

    return {
      cases: migrated,
      paging,
    }
  }
  async getCase(id: string): Promise<CaseDetailedDto> {
    const caseModel = await this.caseModel.scope('detailed').findByPk(id)

    if (!caseModel) {
      throw new NotFoundException(`Case with id ${id} not found`)
    }

    return caseModel.fromModelDetailed()
  }
}
