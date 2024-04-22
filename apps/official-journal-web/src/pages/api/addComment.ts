import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { logger } from '@dmr.is/logging'
import { CaseStatus } from '@dmr.is/shared/dto'

import {
  CaseCommentCaseStatusEnum,
  CaseCommentTypeEnum,
  CaseStatusEnum,
} from '../../gen/fetch'
import { createDmrClient } from '../../lib/api/createClient'

const commentBodySchema = z.object({
  caseId: z.string(),
  internal: z.boolean(),
  comment: z.string(),
  type: z.nativeEnum(CaseCommentTypeEnum),
  from: z.string().nullable(),
  to: z.string().nullable(),
})

const mapCaseCommentStatus = (val?: string) => {
  switch (val) {
    case CaseStatusEnum.Innsent:
    case CaseCommentCaseStatusEnum.Innsent:
      return CaseCommentCaseStatusEnum.Innsent
    case CaseStatus.Rejected:
    case CaseCommentCaseStatusEnum.BirtinguHafna:
      return CaseCommentCaseStatusEnum.BirtinguHafna
    case CaseStatus.InProgress:
    case CaseCommentCaseStatusEnum.Grunnvinnsla:
      return CaseCommentCaseStatusEnum.Grunnvinnsla
    case CaseStatus.Unpublished:
    case CaseCommentCaseStatusEnum.TekiRBirtingu:
      return CaseCommentCaseStatusEnum.TekiRBirtingu
    case CaseStatus.Published:
    case CaseCommentCaseStatusEnum.Tgefi:
      return CaseCommentCaseStatusEnum.Tgefi
    case CaseStatusEnum.Tilbi:
    case CaseCommentCaseStatusEnum.Tilbi:
      return CaseCommentCaseStatusEnum.Tilbi
    case CaseStatusEnum.Yfirlestur:
    case CaseCommentCaseStatusEnum.Yfirlestur:
      return CaseCommentCaseStatusEnum.Yfirlestur
    default:
      return null
  }
}

const LOGGING_CATEGORY = 'ApiAddComment'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    commentBodySchema.parse(req.body)
  } catch (e) {
    return res.status(400).json({ error: 'Invalid request body' })
  }

  const dmrClient = createDmrClient()

  const theCase = await dmrClient.getCase(req.body.caseId)

  if (!theCase) {
    return res.status(404).json({ error: 'Case not found' })
  }

  const caseCommentStatus = mapCaseCommentStatus(theCase.status)

  if (!caseCommentStatus) {
    return res.status(400).json({ error: 'Invalid case status' })
  }

  try {
    logger.info('Adding comment to application', {
      applicationId: req.body.applicationId,
      category: LOGGING_CATEGORY,
    })

    const addCommentResponse = await dmrClient.addComment({
      caseId: req.body.caseId,
      postCaseComment: {
        comment: req.body.comment,
        from: req.body.from,
        internal: req.body.internal,
        title: req.body.title,
        to: req.body.to,
        type: req.body.type,
      },
    })

    return res.status(200).json(addCommentResponse)
  } catch (error) {
    logger.error('Exception occured, could not add comment to application', {
      error,
      category: LOGGING_CATEGORY,
    })
  }
}
