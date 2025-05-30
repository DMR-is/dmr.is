import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { CaseDto, GetCasesDto } from './dto/case.dto'
import { caseMigrate } from './dto/case.migrate'
import { ICaseService } from './case.service.interface'
import { CaseModel } from './cases.model'

@Injectable()
export class CaseService implements ICaseService {
  constructor(
    @InjectModel(CaseModel) private readonly caseModel: typeof CaseModel,
  ) {}
  async getCases(): Promise<GetCasesDto> {
    const cases = await this.caseModel.findAll()

    const migrated = cases.map((model) => caseMigrate(model))

    return {
      cases: migrated,
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
