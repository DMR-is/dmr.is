import { Column, DataType, Model } from 'sequelize-typescript'

import { ParanoidTable } from '@dmr.is/shared-models-base'

import { LegalGazetteModels } from '../core/constants'
import {
  PublicationSearchQueryKind,
  PublicationSearchTrackingEventDto,
  PublicationSearchTrackingFiltersDto,
} from '../modules/advert/publications/dto/publication-search-tracking.dto'

type PublicationSearchEventAttributes = {
  id: string
  createdAt: Date
} & PublicationSearchTrackingEventDto

type PublicationSearchEventCreateAttributes = PublicationSearchTrackingEventDto

@ParanoidTable({
  tableName: LegalGazetteModels.PUBLICATION_SEARCH_EVENT,
  freezeTableName: true,
  paranoid: false,
  timestamps: false,
})
export class PublicationSearchEventModel extends Model<
  PublicationSearchEventAttributes,
  PublicationSearchEventCreateAttributes
> {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    allowNull: false,
    defaultValue: DataType.UUIDV4,
  })
  override id!: string

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  route!: string

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  backend!: string

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'normalized_query',
  })
  normalizedQuery!: string | null

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    field: 'query_hash',
  })
  queryHash!: string | null

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'query_kind',
  })
  queryKind!: PublicationSearchQueryKind

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'query_length',
  })
  queryLength!: number

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'query_token_count',
  })
  queryTokenCount!: number

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    field: 'has_filters',
  })
  hasFilters!: boolean

  @Column({
    type: DataType.JSONB,
    allowNull: false,
    defaultValue: {},
  })
  filters!: PublicationSearchTrackingFiltersDto

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  page!: number

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'page_size',
  })
  pageSize!: number

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'page_result_count',
  })
  pageResultCount!: number

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'total_result_count',
  })
  totalResultCount!: number

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'duration_ms',
  })
  durationMs!: number

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
    field: 'created_at',
  })
  override createdAt!: Date
}
