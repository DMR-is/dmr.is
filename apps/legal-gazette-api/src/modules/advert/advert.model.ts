import {
  BelongsTo,
  Column,
  DataType,
  DefaultScope,
  ForeignKey,
  Scopes,
} from 'sequelize-typescript'

import { LegalGazetteModels } from '@dmr.is/legal-gazette/constants'
import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { CaseModel } from '../cases/cases.model'

type AdvertAttributes = {
  caseId: string
  publicationNumber: string
  publishedAt: Date | null
  html: string
  case: CaseModel
}

export type AdvertCreateAttributes = {
  html: string
  scheduledAt: Date
  version?: AdvertVersion
  caseId?: string
}

export enum AdvertVersion {
  A = 'A',
  B = 'B',
  C = 'C',
}

@BaseTable({ tableName: LegalGazetteModels.ADVERT })
@DefaultScope(() => ({
  order: [['publishedAt', 'DESC', 'NULLS LAST']],
}))
@Scopes(() => ({
  withPublicationNumber: {
    include: [
      {
        model: CaseModel.unscoped(),
        attributes: ['caseNumber'],
        required: true,
      },
    ],
  },
}))
export class AdvertModel extends BaseModel<
  AdvertAttributes,
  AdvertCreateAttributes
> {
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'case_id',
  })
  @ForeignKey(() => CaseModel)
  caseId!: string

  @Column({
    type: DataType.VIRTUAL,
  })
  get publicationNumber(): string {
    const advertCase = this.getDataValue('case')

    return advertCase.caseNumber
  }

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'published_at',
    defaultValue: null,
  })
  publishedAt!: Date | null

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'scheduled_at',
  })
  scheduledAt!: Date

  @Column({
    type: DataType.ENUM(...Object.values(AdvertVersion)),
    allowNull: false,
    defaultValue: AdvertVersion.A,
    field: 'version',
  })
  version!: AdvertVersion

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  html!: string

  @BelongsTo(() => CaseModel, { foreignKey: 'caseId' })
  case!: CaseModel
}
