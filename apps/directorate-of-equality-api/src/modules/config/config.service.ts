import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { ConfigDto, UpdateConfigDto } from './dto/config.dto'
import { ConfigModel } from './models/config.model'
import { configMessages } from './config.messages'
import { IConfigService } from './config.service.interface'

const LOGGING_CONTEXT = 'ConfigService'
const SALARY_DIFFERENCE_THRESHOLD_CONFIG_KEY =
  'salary_difference_threshold_percent'

@Injectable()
export class ConfigService implements IConfigService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(ConfigModel)
    private readonly configModel: typeof ConfigModel,
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
      throw new NotFoundException(configMessages.notFound(key))
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
      throw new NotFoundException(configMessages.notFound(key))
    }

    return configs.map((c) => c.fromModel())
  }

  async updateByKey(key: string, dto: UpdateConfigDto): Promise<ConfigDto> {
    this.logger.info(`Updating config entry with key "${key}"`, {
      context: LOGGING_CONTEXT,
    })

    const current = await this.configModel.findOne({
      where: { key, supersededAt: null },
    })

    if (!current) {
      throw new NotFoundException(configMessages.notFound(key))
    }

    if (key === SALARY_DIFFERENCE_THRESHOLD_CONFIG_KEY) {
      this.assertThresholdIsLowered(current.value, dto.value)
    }

    await current.update({ supersededAt: new Date() })

    const newEntry = await this.configModel.create({
      key,
      value: dto.value,
      description:
        dto.description !== undefined ? dto.description : current.description,
    })

    return newEntry.fromModel()
  }

  /**
   * The salary-difference threshold only ever ratchets DOWN — the legal limit is
   * tightened each February and is never loosened again. Raising the stored
   * value would silently widen the allowed band and re-approve reports the
   * stricter threshold rejected, so the rule is enforced here rather than in the
   * admin UI, where any other caller of `PATCH /config/:key` would bypass it.
   */
  private assertThresholdIsLowered(currentValue: string, nextValue: string) {
    const next = Number(nextValue.trim())

    if (!Number.isFinite(next) || next <= 0) {
      throw new BadRequestException(
        configMessages.thresholdNotPositiveNumber(nextValue),
      )
    }

    const current = Number(currentValue.trim())

    if (Number.isFinite(current) && next >= current) {
      throw new BadRequestException(
        configMessages.thresholdNotLowered(currentValue, nextValue),
      )
    }
  }
}
