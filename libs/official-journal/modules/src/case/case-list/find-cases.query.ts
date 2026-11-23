import { OrderItem } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'

import { type Logger } from '@dmr.is/logging'
import { GetCasesQuery } from '@dmr.is/shared-dto'
import { getLimitAndOffset } from '@dmr.is/utils-server/serverUtils'

import { caseParameters } from '../mappers/case-parameters.mapper'
import { CaseModel } from '../models'
import { casesIncludes } from '../relations'

const LOGGING_CATEGORY = 'case-service'
const LOGGING_QUERY = 'CaseServiceQueryRunner'

/**
 * The paged case-list query. Shared by `CaseService` (admin) and
 * `CaseListService` (public journal API), so the public API can list cases
 * without loading the whole case module.
 */
export const findCases = (
  caseModel: typeof CaseModel,
  params: GetCasesQuery,
  logger: Logger,
) => {
  const whereParams = caseParameters(params)
  const sortKeys: { [key: string]: OrderItem } = {
    caseRequestPublishDate: ['requestedPublicationDate', params.direction],
    casePublishDate: Sequelize.literal(
      `"publishedAt" ${params.direction} NULLS LAST`,
    ),
    caseRegistrationDate: ['createdAt', params.direction],
    caseStatus: ['statusId', params.direction],
  }
  const sortBy = sortKeys[params.sortBy] || 'requestedPublicationDate'
  const { limit, offset } = getLimitAndOffset(params)

  return caseModel.findAndCountAll({
    distinct: true,
    benchmark: true,
    offset: offset,
    limit: limit,
    attributes: [
      'id',
      'requestedPublicationDate',
      'createdAt',
      'year',
      'advertTitle',
      'fastTrack',
      'publishedAt',
      'publicationNumber',
      'statusId',
      'caseNumber',
    ],
    where: whereParams,
    include: casesIncludes({
      department: params?.department,
      type: params?.type,
      status: params?.status,
      institution: params?.institution,
      category: params?.category,
    }),
    order: [sortBy],
    logging: (_, timing) => {
      logger.info(`getCasesSqlQuery executed in ${timing}ms`, {
        context: LOGGING_QUERY,
        category: LOGGING_CATEGORY,
        query: 'getCasesSqlQuery',
      })
    },
  })
}
