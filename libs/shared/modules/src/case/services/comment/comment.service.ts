import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  CaseComment,
  GetCaseCommentsQuery,
  GetCaseCommentsResponse,
  PostCaseComment,
} from '@dmr.is/shared/dto'

import { Inject, Injectable, NotFoundException } from '@nestjs/common'

import { caseCommentMigrate } from '../../../util'
import { CaseDto } from '../../models/Case'
import { CaseCommentsDto } from '../../models/CaseComments'
import { ICaseCommentService } from './comment.service.interface'

const LOGGING_CATEGORY = 'CaseCommentService'

@Injectable()
export class CaseCommentService implements ICaseCommentService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(CaseDto) private caseModel: typeof CaseDto,
    @Inject(CaseCommentsDto) private caseCommentsModels: typeof CaseCommentsDto,
  ) {
    this.logger.info('Using CaseServiceMock')
  }
  async getComments(
    caseId: string,
    params?: GetCaseCommentsQuery,
  ): Promise<GetCaseCommentsResponse> {
    this.logger.info('Getting comments for case', {
      id: caseId,
      category: LOGGING_CATEGORY,
    })

    const onlyExternal = params?.type === 'external'
    const onlyInternal = params?.type === 'internal'

    const found = await this.caseCommentsModels.findAll({
      where: { case_id: caseId },
      // include: [CaseCommentDto], // TODO: Test this
    })

    const comments = found
      .map((c) => caseCommentMigrate(c.case_comment))
      .filter((c) => {
        if (onlyExternal) {
          return !c.internal
        }

        if (onlyInternal) {
          return c.internal
        }

        return true
      })

    return Promise.resolve({
      comments,
    })
  }

  async postComment(
    caseId: string,
    body: PostCaseComment,
  ): Promise<CaseComment[]> {
    this.logger.info('Adding comment to application', {
      id: caseId,
      category: LOGGING_CATEGORY,
    })

    const theCase = await this.getCase(caseId)

    if (!theCase) {
      this.logger.warn('Case not found', {
        id: caseId,
        category: LOGGING_CATEGORY,
      })
      throw new NotFoundException('Case not found')
    }

    const newCommentTitle = mapCaseCommentTypeToCaseCommentTitle(body.type)
    if (!newCommentTitle) {
      this.logger.warn('Invalid comment type', {
        id: caseId,
        category: LOGGING_CATEGORY,
      })
      throw new BadRequestException('Invalid comment type')
    }

    const newComment: CaseComment = {
      id: uuid(),
      caseStatus: theCase.status,
      createdAt: new Date().toISOString(),
      internal: body.internal,
      type: body.type,
      task: {
        to: body.to,
        from: body.from,
        comment: body.comment,
        title: newCommentTitle,
      },
    }

    // TODO: plug into db when rdy

    return Promise.resolve([...theCase.comments, newComment])
  }

  async deleteComment(
    caseId: string,
    commentId: string,
  ): Promise<CaseComment[]> {
    this.logger.info('Deleting comment from application', {
      id: caseId,
      commentId,
      category: LOGGING_CATEGORY,
    })

    const caseComments = await this.getComments(caseId)

    if (!caseComments) {
      throw new NotFoundException('Case not found')
    }

    const found = caseComments.find((c) => c.id === commentId)

    if (!found) {
      this.logger.warn('Comment not found', {
        id: caseId,
        commentId,
        category: LOGGING_CATEGORY,
      })
      throw new NotFoundException('Comment not found')
    }

    const newComments = caseComments.filter((c) => c.id !== commentId)

    // TODO: plug into db when rdy

    return Promise.resolve(newComments)
  }
}
