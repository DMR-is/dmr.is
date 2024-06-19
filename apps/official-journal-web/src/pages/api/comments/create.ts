import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { logger } from '@dmr.is/logging'
import { CaseStatus } from '@dmr.is/shared/dto'

import {
  CaseCommentCaseStatusEnum,
  CaseStatusEnum,
  PostCaseCommentTypeEnum,
} from '../../../gen/fetch'
import { createDmrClient } from '../../../lib/api/createClient'
import { auditAPIRoute, handleAPIException } from '../../../lib/api/utils'

const commentBodySchema = z.object({
  caseId: z.string(),
  internal: z.boolean(),
  comment: z.string(),
  from: z.string(),
  to: z.string().optional(),
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

const LOGGING_CATEGORY = 'ApiCommentsPost'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  auditAPIRoute({ req })
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    commentBodySchema.parse(req.body)

    const dmrClient = createDmrClient()

    const theCase = await dmrClient.getCase({
      id: req.body.caseId,
    })

    if (!theCase) {
      return res.status(404).json({ error: 'Case not found' })
    }

    const caseCommentStatus = mapCaseCommentStatus(
      theCase._case.activeCase.status,
    )

    if (!caseCommentStatus) {
      return res.status(400).json({ error: 'Invalid case status' })
    }

    const body: z.infer<typeof commentBodySchema> = req.body

    logger.info('Adding comment to application', {
      applicationId: req.body.applicationId,
      category: LOGGING_CATEGORY,
      route: '/api/comments/post',
    })

    const addCommentResponse = await dmrClient.createComment({
      id: body.caseId,
      postCaseComment: {
        comment: body.comment,
        internal: body.internal,
        to: body.to,
        from: body.from,
        type: body.internal
          ? PostCaseCommentTypeEnum.Comment
          : PostCaseCommentTypeEnum.Message,
      },
    })

    return res.status(200).json(addCommentResponse)
  } catch (error) {
    handleAPIException({ error, res })
  }
}
