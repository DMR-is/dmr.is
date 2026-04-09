import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
} from 'sequelize-typescript'

import { BaseModel, BaseTable } from '@dmr.is/shared-models-base'

import { AdvertInvolvedPartyModel } from '../../journal/models/advert-involved-party.model'

type AdditionalPartiesAttributes = {
  involvedPartyId: string
  advertId?: string | null
  caseId?: string | null
  involvedParty?: AdvertInvolvedPartyModel
}

type AdditionalPartiesCreateAttributes = {
  involvedPartyId: string
  advertId?: string | null
  caseId?: string | null
}

@BaseTable({ tableName: 'additional_parties' })
export class AdditionalPartiesModel extends BaseModel<
  AdditionalPartiesAttributes,
  AdditionalPartiesCreateAttributes
> {
  @ForeignKey(() => AdvertInvolvedPartyModel)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'involved_party_id',
  })
  involvedPartyId!: string

  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'advert_id',
  })
  advertId?: string | null

  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'case_id',
  })
  caseId?: string | null

  @BelongsTo(() => AdvertInvolvedPartyModel, 'involved_party_id')
  involvedParty!: AdvertInvolvedPartyModel
}
