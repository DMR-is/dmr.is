import {
  BaseEntityAttributes,
  BaseEntityAttributesDetailed,
} from '@dmr.is/shared/models/base'
import { Order } from 'sequelize'

export enum LegalGazetteModels {
  CASE_TYPE = 'case_type',
}

export const BASE_ENTITY_ATTRIBUTES: Array<keyof BaseEntityAttributes> = [
  'id',
  'title',
  'slug',
]
export const BASE_ENTITY_ATTRIBUTES_DETAILED: Array<
  keyof BaseEntityAttributesDetailed
> = ['id', 'title', 'slug', 'createdAt', 'updatedAt', 'deletedAt']

export const BASE_ENTITY_ORDER_ASC: Order = [['title', 'ASC']]
export const BASE_ENTITY_ORDER_DESC: Order = [['title', 'DESC']]
