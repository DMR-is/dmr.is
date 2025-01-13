import { Op } from 'sequelize'
import { GetCasesQuery } from '@dmr.is/shared/dto'

type WhereClause = {
  id?: {
    [Op.in]: string[]
  }
  advertTitle?: {
    [Op.iLike]: string
  }
  applicationId?: string
  year?: string
  caseNumber?: string
  assignedUserId?: string
  statusId?: { [Op.in]: string[] }
  fastTrack?: boolean
  publishedAt?: { [Op.not]: null } | { [Op.is]: null }
  advertType?: {
    slug: {
      [Op.in]: string[]
    }
  }
  createdAt?: {
    [Op.gte]?: string
    [Op.lte]?: string
  }
}

export const titleOrSlugMatch = (filters?: string | string[]) => {
  const whereClause = {}

  if (!filters) {
    return whereClause
  }

  const isArray = Array.isArray(filters)

  Object.assign(whereClause, {
    [Op.or]: [
      {
        title: isArray ? { [Op.in]: filters } : { [Op.iLike]: `%${filters}%` },
      },
      {
        slug: isArray ? { [Op.in]: filters } : { [Op.iLike]: `%${filters}%` },
      },
    ],
  })

  return whereClause
}

export const caseParameters = (params?: GetCasesQuery) => {
  // Initialize the where clause object must be declared inside the function to avoid side effects
  const whereClause: WhereClause = {}

  // Check and add each parameter to the where clause
  if (params?.id !== undefined) {
    whereClause.id = {
      [Op.in]: params.id,
    }
  }

  if (params?.applicationId !== undefined) {
    whereClause.applicationId = params.applicationId
  }

  if (params?.search !== undefined) {
    whereClause.advertTitle = {
      [Op.iLike]: `%${params.search}%`,
    }
  }

  if (params?.year !== undefined) {
    whereClause.year = params.year
  }

  if (params?.caseNumber !== undefined) {
    whereClause.caseNumber = params.caseNumber
  }

  if (params?.employeeId !== undefined) {
    whereClause.assignedUserId = params.employeeId
  }

  if (params?.fastTrack !== undefined) {
    whereClause.fastTrack = params.fastTrack === 'true'
  }

  if (params?.published === 'true') {
    whereClause.publishedAt = { [Op.not]: null }
  }

  if (params?.published === 'false') {
    whereClause.publishedAt = { [Op.is]: null }
  }

  if (params?.fromDate || params?.toDate) {
    whereClause.createdAt = {
      ...(params?.fromDate && { [Op.gte]: params?.fromDate }),
      ...(params?.toDate && { [Op.lte]: params?.toDate }),
    }
  }
  return whereClause
}
