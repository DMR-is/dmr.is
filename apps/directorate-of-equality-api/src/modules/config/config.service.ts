import { Transaction } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'

import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'
import { InjectConnection, InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { ConfigDto, UpdateConfigDto } from './dto/config.dto'
import { ConfigModel } from './models/config.model'
import { SALARY_DIFFERENCE_THRESHOLD_CONFIG_KEY } from './config.constants'
import { configMessages } from './config.messages'
import { IConfigService } from './config.service.interface'

const LOGGING_CONTEXT = 'ConfigService'

/**
 * A threshold value the readers can actually read back. Every consumer parses
 * the stored string with `parseFloat`, which is laxer than `Number` — it would
 * read `"0x2"` as `0` after `Number` validated it as `2` — so validation is
 * pinned to a shape both agree on. Two decimals matches
 * `report_result.salary_difference_threshold_percent`, a `DECIMAL(5, 2)`.
 */
const THRESHOLD_VALUE_PATTERN = /^\d+(\.\d{1,2})?$/

@Injectable()
export class ConfigService implements IConfigService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectConnection() private readonly sequelize: Sequelize,
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

  /**
   * Config is append-only: the active row is superseded and a new one inserted.
   * Both writes run inside one transaction with the active row locked
   * `FOR UPDATE`, because the two failure modes are otherwise unrecoverable
   * through the API — two concurrent lowerings would each validate against the
   * same active row and leave two rows with `supersededAt: null`, and an insert
   * that fails after the supersede would leave zero, which `updateByKey` itself
   * needs one of to run at all.
   */
  async updateByKey(key: string, dto: UpdateConfigDto): Promise<ConfigDto> {
    this.logger.info(`Updating config entry with key "${key}"`, {
      context: LOGGING_CONTEXT,
    })

    return this.sequelize.transaction(async (transaction) => {
      const current = await this.configModel.findOne({
        where: { key, supersededAt: null },
        lock: Transaction.LOCK.UPDATE,
        transaction,
      })

      if (!current) {
        throw new NotFoundException(configMessages.notFound(key))
      }

      const value =
        key === SALARY_DIFFERENCE_THRESHOLD_CONFIG_KEY
          ? this.assertThresholdIsLowered(current.value, dto.value)
          : dto.value

      await current.update({ supersededAt: new Date() }, { transaction })

      const newEntry = await this.configModel.create(
        {
          key,
          value,
          description:
            dto.description !== undefined
              ? dto.description
              : current.description,
        },
        { transaction },
      )

      return newEntry.fromModel()
    })
  }

  /**
   * The salary-difference threshold only ever ratchets DOWN — the legal limit is
   * tightened each February and is never loosened again. Raising the stored
   * value would silently widen the allowed band and re-approve reports the
   * stricter threshold rejected, so the rule is enforced here rather than in the
   * admin UI, where any other caller of `PATCH /config/:key` would bypass it.
   *
   * Returns the normalized value to store, so the number that was validated is
   * the one that gets written and read back.
   */
  private assertThresholdIsLowered(
    currentValue: string,
    nextValue: string,
  ): string {
    const nextRaw = nextValue.trim()

    if (!THRESHOLD_VALUE_PATTERN.test(nextRaw)) {
      throw new BadRequestException(
        configMessages.thresholdNotPositiveNumber(nextValue),
      )
    }

    const next = Number(nextRaw)

    if (next <= 0) {
      throw new BadRequestException(
        configMessages.thresholdNotPositiveNumber(nextValue),
      )
    }

    const current = Number(currentValue.trim())

    // An active value nobody can parse is a broken row, not permission to skip
    // the ratchet: `Number('3,9')` is NaN while `parseFloat('3,9')` — what the
    // readers call — is 3, so treating it as "no constraint" would let the
    // threshold be raised on exactly the hand-edited rows this page replaces.
    if (!Number.isFinite(current)) {
      throw new InternalServerErrorException(
        configMessages.thresholdCurrentValueMalformed(currentValue),
      )
    }

    if (next >= current) {
      throw new BadRequestException(
        configMessages.thresholdNotLowered(currentValue, nextValue),
      )
    }

    return String(next)
  }
}
