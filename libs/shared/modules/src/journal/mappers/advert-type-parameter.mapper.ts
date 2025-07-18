import { Op } from 'sequelize'

import { GetAdvertsQueryParams } from '@dmr.is/shared/dto'

type WhereClause = {
  title?: { [Op.iLike]: string }
}

// Initialize the where clause object
const whereClause: WhereClause = {}

const typesParameters = (params?: GetAdvertsQueryParams) => {
  // Check and add each parameter to the where clause
  if (params?.search) {
    whereClause.title = {
      [Op.iLike]: `%${params.search}%`,
    }
  }

  return whereClause
}

export { typesParameters }
