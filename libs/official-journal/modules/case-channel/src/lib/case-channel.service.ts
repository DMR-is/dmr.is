import { Inject, Injectable } from '@nestjs/common'
import { ICaseChannelService } from './case-channel.service.interface'
import { ResultWrapper } from '@dmr.is/types'
import { CreateCaseChannelBody } from './dto/case-channel.dto'
import {
  CaseChannelModel,
  CaseChannelsModel,
} from '@dmr.is/official-journal/models'
import { InjectModel } from '@nestjs/sequelize'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { caseChannelMigrate } from '@dmr.is/official-journal/migrations/case-channel/case-channel.migrate'

const LOGGING_CONTEXT = 'CaseChannelService'
const LOGGING_CATEGORY = 'case-channel-service'

@Injectable()
export class CaseChannelService implements ICaseChannelService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(CaseChannelModel)
    private readonly caseChannelModel: typeof CaseChannelModel,
    @InjectModel(CaseChannelsModel)
    private readonly caseChannelsModel: typeof CaseChannelsModel,
  ) {}

  async createCaseChannel(
    caseId: string,
    body: CreateCaseChannelBody,
  ): Promise<ResultWrapper> {
    const channel = await this.caseChannelModel.create(
      {
        name: body.name,
        email: body.email,
        phone: body.phone,
      },
      {
        returning: ['id'],
      },
    )

    await this.caseChannelsModel.create({
      caseId,
      channelId: channel.id,
    })

    const newChannel = await this.caseChannelModel.findByPk(channel.id)

    if (!newChannel) {
      this.logger.warn('Failed to find newly created channel', {
        category: LOGGING_CATEGORY,
        context: LOGGING_CONTEXT,
        caseId,
        channelId: channel.id,
      })
      return ResultWrapper.err({
        code: 500,
        message: 'Failed to create channel',
      })
    }

    const migrated = caseChannelMigrate(newChannel)

    return ResultWrapper.ok(migrated)
  }
  async deleteCaseChannel(
    caseId: string,
    channelId: string,
  ): Promise<ResultWrapper> {
    await this.caseChannelsModel.destroy({
      where: {
        caseId: caseId,
        channelId: channelId,
      },
    })
    await this.caseChannelModel.destroy({
      where: {
        id: channelId,
      },
    })

    return ResultWrapper.ok()
  }
}
