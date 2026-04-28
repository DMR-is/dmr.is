import { Sequelize } from 'sequelize-typescript'

import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { ConfigDto, UpdateConfigDto } from './dto/config.dto'
import { ConfigModel } from './models/config.model'
import { IConfigService } from './config.service.interface'

const LOGGING_CONTEXT = 'ConfigService'

@Injectable()
export class ConfigService implements IConfigService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(ConfigModel)
    private readonly configModel: typeof ConfigModel,
    private readonly sequelize: Sequelize,
  ) {}

  async getAll(): Promise<ConfigDto[]> {
    this.logger.debug('Getting all active config entries', {
      context: LOGGING_CONTEXT,
    })

    const configs = await this.configModel.findAll({
      where: { supersededAt: null },
      order: [['key', 'ASC']],
    })

    return configs.map((c) => c.fromModel())
  }

  async getByKey(key: string): Promise<ConfigDto> {
    this.logger.debug(`Getting active config entry with key "${key}"`, {
      context: LOGGING_CONTEXT,
    })

    const config = await this.configModel.findOne({
      where: { key, supersededAt: null },
    })

    if (!config) {
      throw new NotFoundException(`Config entry with key "${key}" not found`)
    }

    return config.fromModel()
  }

  async getHistoryByKey(key: string): Promise<ConfigDto[]> {
    this.logger.debug(`Getting config history for key "${key}"`, {
      context: LOGGING_CONTEXT,
    })

    const configs = await this.configModel.findAll({
      where: { key },
      order: [['created_at', 'DESC']],
    })

    if (configs.length === 0) {
      throw new NotFoundException(`Config entry with key "${key}" not found`)
    }

    return configs.map((c) => c.fromModel())
  }

  async updateByKey(key: string, dto: UpdateConfigDto): Promise<ConfigDto> {
    this.logger.info(`Updating config entry with key "${key}"`, {
      context: LOGGING_CONTEXT,
    })

    return this.sequelize.transaction(async () => {
      const current = await this.configModel.findOne({
        where: { key, supersededAt: null },
      })

      if (!current) {
        throw new NotFoundException(`Config entry with key "${key}" not found`)
      }

      await current.update({ supersededAt: new Date() })

      const newEntry = await this.configModel.create({
        key,
        value: dto.value,
        description:
          dto.description !== undefined ? dto.description : current.description,
      })

      return newEntry.fromModel()
    })
  }
}
