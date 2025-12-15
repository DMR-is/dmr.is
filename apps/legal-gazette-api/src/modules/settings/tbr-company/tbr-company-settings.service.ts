import { Op, WhereOptions } from 'sequelize'

import { Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { LOGGER_PROVIDER } from '@dmr.is/logging'
import { Logger } from '@dmr.is/logging-next'
import { generatePaging, getLimitAndOffset } from '@dmr.is/utils'

import {
  CreateTBRCompanySettingsDto,
  GetTBRCompanySettingsQueryDto,
  TBRCompanySettingsItemDto,
  TBRCompanySettingsListDto,
  TBRCompanySettingsModel,
  UpdateTbrCompanySettingsDto,
} from '../../../models/tbr-company-settings.model'
import { ITBRCompanySettingsService } from './tbr-company-settings.service.interface'

const LOGGING_CONTEXT = 'TBRCompanySettingsService'

@Injectable()
export class TBRCompanySettingsService implements ITBRCompanySettingsService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(TBRCompanySettingsModel)
    private readonly settingsModel: typeof TBRCompanySettingsModel,
  ) {}

  async getSettings(
    query: GetTBRCompanySettingsQueryDto,
  ): Promise<TBRCompanySettingsListDto> {
    const whereClause: WhereOptions = {}

    if (query.search) {
      Object.assign(whereClause, {
        [Op.or]: [
          { name: { [Op.iLike]: `%${query.search}%` } },
          { nationalId: { [Op.iLike]: `%${query.search}%` } },
          { email: { [Op.iLike]: `%${query.search}%` } },
          { phone: { [Op.iLike]: `%${query.search}%` } },
        ],
      })
    }

    if (query.activeOnly) {
      Object.assign(whereClause, {
        active: true,
      })
    }

    const { limit, offset } = getLimitAndOffset({
      page: query.page,
      pageSize: query.pageSize,
    })

    const settingsResults = await this.settingsModel.findAndCountAll({
      limit,
      offset,
      where: whereClause,
    })

    const items = settingsResults.rows.map((item) => item.fromModel())
    const paging = generatePaging(
      settingsResults.rows,
      query.page,
      query.pageSize,
      settingsResults.count,
    )

    return {
      items,
      paging,
    }
  }
  async markAsActive(id: string): Promise<void> {
    this.logger.info(`Marking TBR company setting as active`, {
      context: LOGGING_CONTEXT,
      id: id,
    })
    const setting = await this.settingsModel.findByPkOrThrow(id)

    await this.settingsModel.update(
      { active: true },
      { where: { nationalId: setting.nationalId } },
    )
  }
  async markAsInactive(id: string): Promise<void> {
    this.logger.info(`Marking TBR company setting as inactive`, {
      context: LOGGING_CONTEXT,
      id: id,
    })

    const setting = await this.settingsModel.findByPkOrThrow(id)

    await this.settingsModel.update(
      { active: false },
      { where: { nationalId: setting.nationalId } },
    )
  }
  async deleteSetting(id: string): Promise<void> {
    this.logger.info(`Deleting TBR company setting`, {
      context: LOGGING_CONTEXT,
      id: id,
    })

    const setting = await this.settingsModel.findByPkOrThrow(id)

    await setting.destroy({ force: true })
  }
  async createSetting(
    body: CreateTBRCompanySettingsDto,
  ): Promise<TBRCompanySettingsItemDto> {
    this.logger.info(`Creating TBR company setting`, {
      context: LOGGING_CONTEXT,
    })

    const createdSetting = await this.settingsModel.create({
      name: body.name,
      nationalId: body.nationalId,
      email: body.email,
      phone: body.phone,
      code: 'RL2',
      active: true,
    })

    return createdSetting.fromModel()
  }
  async updateSetting(
    id: string,
    body: UpdateTbrCompanySettingsDto,
  ): Promise<TBRCompanySettingsItemDto> {
    const setting = await this.settingsModel.findByPkOrThrow(id)

    this.logger.info(`Updating TBR company setting`, {
      context: LOGGING_CONTEXT,
      id: id,
    })

    const updatedSetting = await setting.update({
      name: body.name,
      nationalId: body.nationalId,
      email: body.email,
      phone: body.phone,
    })

    return updatedSetting.fromModel()
  }
}
