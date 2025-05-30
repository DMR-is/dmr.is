import { Model } from 'sequelize-typescript'

import { ApiProperty, IntersectionType } from '@nestjs/swagger'

export class BaseEntityDto {
  @ApiProperty({
    type: String,
    description: 'UUIDV4 of the entity',
    example: '182391f7-d355-46f0-bcee-4d8baa68b55d',
  })
  readonly id!: string

  @ApiProperty({
    type: String,
    description: 'Title of the entity',
    example: 'Base entity',
  })
  readonly title!: string

  @ApiProperty({
    type: String,
    description: 'Slug of the entity',
    example: 'base-entity',
  })
  slug!: string
}

export class DetailedDto {
  @ApiProperty({
    type: String,
    description: 'ISO representation of the creation date',
    example: '2021-08-31T12:00:00.000Z',
  })
  readonly createdAt!: string

  @ApiProperty({
    type: String,
    description: 'ISO representation of the updated date',
    example: '2021-08-31T12:00:00.000Z',
  })
  readonly updatedAt!: string

  @ApiProperty({
    type: String,
    description: 'ISO representation of the deletion date',
    example: '2021-08-31T12:00:00.000Z',
    required: false,
    nullable: true,
  })
  readonly deletedAt!: string | null
}

export class BaseEntityDetailedDto extends IntersectionType(
  BaseEntityDto,
  DetailedDto,
) {}

export const baseEntityMigrate = <T extends Model>(model: T): BaseEntityDto => {
  return {
    id: model.getDataValue('id'),
    title: model.getDataValue('title'),
    slug: model.getDataValue('slug'),
  }
}

export const baseEntityDetailedMigrate = <T extends Model>(
  model: T,
  addtionalProps?: string | string[],
) => {
  const hasAdditionalProps = addtionalProps !== undefined
  const addtional: Record<string, any> = {}

  if (addtionalProps) {
    const isArr = Array.isArray(addtionalProps)

    if (isArr) {
      addtionalProps.forEach((prop) => {
        addtional[prop] = model.getDataValue(prop)
      })
    }
  }

  const defaultModel = {
    id: model.getDataValue('id'),
    title: model.getDataValue('title'),
    slug: model.getDataValue('slug'),
    createdAt: model.getDataValue('createdAt').toISOString(),
    updatedAt: model.getDataValue('updatedAt').toISOString(),
    deletedAt: model.getDataValue('deletedAt')
      ? model.getDataValue('deletedAt').toISOString()
      : null,
  }

  return hasAdditionalProps
    ? {
        ...defaultModel,
        ...addtional,
      }
    : defaultModel
}

type AdditionalProp = [key: string, migrationFn?: (value: any) => any]

interface MigrationProps {
  model: Model
  defaultMigration?: typeof baseEntityMigrate | typeof baseEntityDetailedMigrate
  additionalProps?: AdditionalProp[]
}

export const migrate = <R = Record<string, any>>({
  model,
  defaultMigration = baseEntityMigrate,
  additionalProps,
}: MigrationProps): R => {
  const additional: Record<string, any> = {}

  additionalProps?.forEach(([key, migrationFn]) => {
    additional[key] = migrationFn
      ? migrationFn(model.getDataValue(key))
      : model.getDataValue(key)
  })

  if (defaultMigration) {
    return {
      ...defaultMigration(model),
      ...additional,
    } as R
  }

  return additional as R
}
