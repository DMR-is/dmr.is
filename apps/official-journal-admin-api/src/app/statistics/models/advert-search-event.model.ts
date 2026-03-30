import { Column, DataType, Model, Table } from 'sequelize-typescript'

export type AdvertSearchEventFilters = Partial<
  Record<
    | 'department'
    | 'type'
    | 'mainType'
    | 'category'
    | 'involvedParty'
    | 'year'
    | 'dateFrom'
    | 'dateTo',
    string | string[]
  >
>

type AdvertSearchEventAttributes = {
  id: string
  route: string
  backend: string
  normalizedQuery: string | null
  queryHash: string | null
  queryKind: string
  queryLength: number
  queryTokenCount: number
  hasFilters: boolean
  filters: AdvertSearchEventFilters
  page: number
  pageSize: number
  sortBy: string | null
  direction: string | null
  pageResultCount: number
  totalResultCount: number
  durationMs: number
  createdAt: Date
}

@Table({
  tableName: 'advert_search_event',
  timestamps: false,
})
export class AdvertSearchEventModel extends Model<AdvertSearchEventAttributes> {
  @Column({
    type: DataType.UUIDV4,
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
  queryKind!: string

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
  filters!: AdvertSearchEventFilters

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
    type: DataType.STRING,
    allowNull: true,
    field: 'sort_by',
  })
  sortBy!: string | null

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  direction!: string | null

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
  createdAt!: Date
}
