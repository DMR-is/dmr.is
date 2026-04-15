import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
} from 'sequelize-typescript'

import { ApiProperty } from '@nestjs/swagger'

import { BaseModel, BaseTable } from '@dmr.is/shared-models-base'

import { LegalGazetteModels } from '../core/constants'
import { AdvertPublicationModel } from './advert-publication.model'

export type BackfilledPublicationAttributes = {
  publicationId: string
}

@BaseTable({ tableName: LegalGazetteModels.BACKFILLED_PUBLICATION })
export class BackfilledPublicationModel extends BaseModel<
  BackfilledPublicationAttributes,
  BackfilledPublicationAttributes
> {
  @Column({
    field: 'publication_id',
    type: DataType.UUID,
    allowNull: false,
  })
  @ForeignKey(() => AdvertPublicationModel)
  @ApiProperty({ type: String })
  publicationId!: string

  @BelongsTo(() => AdvertPublicationModel)
  publication!: AdvertPublicationModel
}
