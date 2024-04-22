import { NextApiRequest, NextApiResponse } from 'next'
import { v4 as uuid } from 'uuid'
import { z } from 'zod'
import { logger } from '@dmr.is/logging'
import { CaseStatus } from '@dmr.is/shared/dto'

import {
  CaseComment,
  CaseCommentCaseStatusEnum,
  CaseCommentTypeEnum,
  CaseStatusEnum,
} from '../../gen/fetch'
import { createDmrClient } from '../../lib/api/createClient'

const commentBodySchema = z.object({
  caseId: z.string(),
  internal: z.boolean(),
  commnet: z.string(),
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

const mapCaseCommentType = (val?: string) => {
  switch (val) {
    case 'submit':
      return CaseCommentTypeEnum.Submit
    case 'assign':
      return CaseCommentTypeEnum.Assign
    case 'update':
      return CaseCommentTypeEnum.Update
    case 'comment':
      return CaseCommentTypeEnum.Comment
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

  const caseType = mapCaseCommentType(req.body.status)

  if (!caseType) {
    return res.status(400).json({ error: 'Invalid status' })
  }

  const newComment: CaseComment = {
    id: uuid(),
    createdAt: new Date().toISOString(),
    caseStatus: caseCommentStatus,
    type: caseType,
    task: {
      comment: req.body.comment,
      from: req.body.from,
      title: req.body.title,
      to: req.body.to,
    },
  }

  try {
    logger.info('Adding comment to application', {
      applicationId: req.body.applicationId,
      category: LOGGING_CATEGORY,
    })

    await dmrClient.case
  } catch (error) {
    logger.error('Exception occured, could not add comment to application', {
      error,
      category: LOGGING_CATEGORY,
    })
  }
}
