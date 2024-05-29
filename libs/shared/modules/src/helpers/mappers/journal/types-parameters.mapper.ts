import { Op } from 'sequelize'
import { GetAdvertTypesQueryParams, GetCasesQuery } from '@dmr.is/shared/dto'

type WhereClause = {
  title?: { [Op.iLike]: string }
  departmentId?: string
}

// Initialize the where clause object
const whereClause: WhereClause = {}

const typesParameters = (params?: GetAdvertTypesQueryParams) => {
  // Check and add each parameter to the where clause
  if (params?.search !== undefined) {
    whereClause.title = {
      [Op.iLike]: `%${params.search}%`,
    }
  }

  if (params?.department !== undefined) {
    whereClause.departmentId = params?.department
  }

  return whereClause
}

export { typesParameters }
