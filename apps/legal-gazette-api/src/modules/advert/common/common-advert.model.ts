import { BulkCreateOptions } from 'sequelize'
import {
  BeforeBulkCreate,
  BeforeCreate,
  BeforeUpdate,
  BelongsTo,
  Column,
  DataType,
  DefaultScope,
  ForeignKey,
} from 'sequelize-typescript'

import { BadRequestException, NotFoundException } from '@nestjs/common'

import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'
import { formatDate } from '@dmr.is/utils'

import { LegalGazetteModels } from '../../../lib/constants'
import { validateAdvertStatus } from '../../../lib/utils'
import { CaseModel } from '../../case/case.model'
import { AdvertModel } from '../advert.model'
import { CommonAdvertDto } from './dto/common-advert.dto'

type CommonAdvertAttributes = {
  advertId: string
  islandIsApplicationId?: string
  caption: string
}

export type CommonAdvertCreateAttributes = {
  advertId?: string
  islandIsApplicationId?: string
  caption: string
}

@BaseTable({ tableName: LegalGazetteModels.COMMON_ADVERT })
@DefaultScope(() => ({
  attributes: ['id', 'advertId', 'caption'],
}))
export class CommonAdvertModel extends BaseModel<
  CommonAdvertAttributes,
  CommonAdvertCreateAttributes
> {
  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'advert_id',
  })
  @ForeignKey(() => AdvertModel)
  advertId!: string

  @Column({
    type: DataType.UUID,
    field: 'island_is_application_id',
  })
  island_is_application_id?: string

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'caption',
  })
  caption!: string

  @BelongsTo(() => AdvertModel, { foreignKey: 'advertId' })
  advert?: AdvertModel

  @BeforeCreate
  static async setHTMLTemplate(model: CommonAdvertModel): Promise<void> {
    const advert = await AdvertModel.findByPk(model.advertId, {
      include: [
        {
          model: CaseModel,
          attributes: ['id', 'caseNumber'],
        },
      ],
    })

    if (!advert) {
      throw new NotFoundException('Advert not found')
    }

    const html = `
    <div>
      <p align="right">Áætlaður útgáfud.: ${formatDate(advert.scheduledAt, 'dd. MMMM yyyy')}</p>
      <h1>${advert.category.title} - ${model.caption}</h1>
      ${advert.html}
      <p>${advert.signatureLocation}, ${formatDate(advert.scheduledAt, 'dd. MMMM yyyy')}</p>
      <p>${advert.signatureName}</p>
      <p align="right">${advert.case.caseNumber}${advert.version}</p>
    </div>
    `.trim()

    await advert.update({ html: html })
  }

  @BeforeBulkCreate
  static setHTMLTemplateBulk(
    _models: CommonAdvertModel[],
    options: BulkCreateOptions,
  ): void {
    options.individualHooks = true
  }

  @BeforeUpdate
  static validateAdvertStatus(instance: CommonAdvertModel): void {
    if (!instance.advert?.statusId) {
      this.logger.warn('Cannot update common advert without advert status id')

      throw new BadRequestException('Cannot update advert in this status')
    }

    validateAdvertStatus(instance.advert)
  }

  static fromModel(model: CommonAdvertModel): CommonAdvertDto {
    return {
      caption: model.caption,
    }
  }

  fromModel(): CommonAdvertDto {
    return CommonAdvertModel.fromModel(this)
  }
}
