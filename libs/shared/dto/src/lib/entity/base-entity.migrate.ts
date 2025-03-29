import { BaseEntity } from './base-entity.dto'

export const baseEntityMigrate = <T extends BaseEntity>(
  model: T,
): BaseEntity => {
  return {
    id: model.id,
    title: model.title,
    slug: model.slug,
  }
}
