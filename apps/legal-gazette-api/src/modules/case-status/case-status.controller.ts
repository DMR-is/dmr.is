import { Controller, Get, NotFoundException, Param } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { LGResponse } from '@dmr.is/legal-gazette/decorators'
import {
  BaseEntityDetailedDto,
  baseEntityDetailedMigrate,
  BaseEntityDto,
  migrate,
} from '@dmr.is/legal-gazette/dto'

import {
  CaseStatusDto,
  CaseStatusDetailedDto,
  GetCasesStatusesDetailedDto,
  GetCaseStatusesDto,
} from './dto/case-status.dto'
import { CaseStatusModel } from './case-status.model'

@Controller({
  path: 'statuses',
  version: '1',
})
export class CaseStatusController {
  constructor(
    @InjectModel(CaseStatusModel)
    private readonly caseStatusModel: typeof CaseStatusModel,
  ) {}

  @Get('/')
  @LGResponse({ operationId: 'getCaseStatuses', type: GetCaseStatusesDto })
  async getCasesStatuses(): Promise<GetCaseStatusesDto> {
    const statuses = await this.caseStatusModel.findAll()

    const migrated = statuses.map((status) =>
      migrate<BaseEntityDto>({
        model: status,
      }),
    )

    return {
      statuses: migrated,
    }
  }

  @Get('/detailed')
  @LGResponse({
    operationId: 'getCaseStatusesDetailed',
    type: GetCasesStatusesDetailedDto,
  })
  async getCasesStatusesDetailed(): Promise<GetCasesStatusesDetailedDto> {
    const statuses = await this.caseStatusModel.scope('detailed').findAll()

    const migrated = statuses.map((status) =>
      migrate<BaseEntityDetailedDto>({
        model: status,
        defaultMigration: baseEntityDetailedMigrate,
      }),
    )

    return {
      statuses: migrated,
    }
  }

  @Get(':id')
  @LGResponse({ operationId: 'getCaseStatus', type: CaseStatusDto })
  async getStatusById(@Param('id') id: string): Promise<CaseStatusDto> {
    const status = await this.caseStatusModel.findByPk(id)

    if (!status) {
      throw new NotFoundException(`Case status with id ${id} not found`)
    }

    const migrated = migrate<BaseEntityDto>({
      model: status,
    })

    return migrated
  }

  @Get(':id/detailed')
  @LGResponse({
    operationId: 'getCaseStatusDetailed',
    type: CaseStatusDetailedDto,
  })
  async getStatusDetailedById(
    @Param('id') id: string,
  ): Promise<CaseStatusDetailedDto> {
    const status = await this.caseStatusModel.scope('detailed').findByPk(id)

    if (!status) {
      throw new NotFoundException(`Case status with id ${id} not found`)
    }

    const migrated = migrate<BaseEntityDetailedDto>({
      model: status,
      defaultMigration: baseEntityDetailedMigrate,
    })

    return migrated
  }
}
