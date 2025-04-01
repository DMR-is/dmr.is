import { GetCasesQuery } from '@dmr.is/official-journal/dto/case/case.dto'
import { Op, WhereOptions } from 'sequelize'

export const whereParams = (params?: GetCasesQuery) => {
  const whereClause: WhereOptions = {}

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

  if (params?.employeeId !== undefined) {
    whereClause.assignedUserId = params.employeeId
  }

  if (params?.fastTrack !== undefined) {
    whereClause.fastTrack = params.fastTrack === true
  }

  if (params?.published === true) {
    whereClause.publishedAt = { [Op.not]: null }
  }

  if (params?.published === false) {
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
