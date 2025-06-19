import { Op } from 'sequelize'
import { DefaultScope, Scopes, Table, TableOptions } from 'sequelize-typescript'

import {
  BASE_ENTITY_ATTRIBUTES,
  BASE_ENTITY_ATTRIBUTES_DETAILED,
  BASE_ENTITY_ORDER_ASC,
} from './constants'

export function BaseEntityTable(options: TableOptions = {}) {
  return function (constructor: Function) {
    Table({
      timestamps: true,
      paranoid: true,
      ...options,
    })(constructor)

    DefaultScope(() => ({
      attributes: BASE_ENTITY_ATTRIBUTES,
      order: BASE_ENTITY_ORDER_ASC,
    }))(constructor)

    Scopes(() => ({
      detailed: {
        attributes: BASE_ENTITY_ATTRIBUTES_DETAILED,
        order: BASE_ENTITY_ORDER_ASC,
      },
      deleted: {
        attributes: BASE_ENTITY_ATTRIBUTES_DETAILED,
        order: BASE_ENTITY_ORDER_ASC,
        where: {
          deletedAt: {
            [Op.eq]: null,
          },
        },
      },
      all: {
        attributes: BASE_ENTITY_ATTRIBUTES_DETAILED,
        order: BASE_ENTITY_ORDER_ASC,
        paranoid: false,
      },
    }))(constructor)
  }
}

export function BaseTable(options: TableOptions = {}) {
  return function (constructor: Function) {
    Table({
      timestamps: true,
      paranoid: true,
      ...options,
    })(constructor)
  }
}
