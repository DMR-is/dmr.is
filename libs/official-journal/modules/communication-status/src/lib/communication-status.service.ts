import { Injectable } from '@nestjs/common'
import { ICommunicationStatusService } from './communication-status.service.interface'
import { ResultWrapper } from '@dmr.is/types'
import { GetCommunicationSatusesResponse } from './dto/communication-status.dto'
import { InjectModel } from '@nestjs/sequelize'
import { CaseCommunicationStatusModel } from '@dmr.is/official-journal/models'
import { communicationStatusMigrate } from '@dmr.is/official-journal/migrations/communication-status/communication-status.migrate'

@Injectable()
export class CommunicationStatusService implements ICommunicationStatusService {
  constructor(
    @InjectModel(CaseCommunicationStatusModel)
    private readonly communicationStatusModel: typeof CaseCommunicationStatusModel,
  ) {}
  async getCommunicationStatuses(): Promise<
    ResultWrapper<GetCommunicationSatusesResponse>
  > {
    const statuses = await this.communicationStatusModel.findAll()

    const migrated = statuses.map((status) =>
      communicationStatusMigrate(status),
    )

    return ResultWrapper.ok({
      statuses: migrated,
    })
  }
}
