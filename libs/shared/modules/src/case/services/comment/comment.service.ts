import { v4 as uuid } from 'uuid'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  DeleteCaseCommentResponse,
  GetCaseCommentsQuery,
  GetCaseCommentsResponse,
  PostCaseComment,
  PostCaseCommentResponse,
} from '@dmr.is/shared/dto'
import { mapCaseCommentTypeToCaseCommentTitle } from '@dmr.is/utils'

import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'

import {
  caseCommentMigrate,
  caseCommentTitleMapper,
  caseCommentTypeMapper,
} from '../../../util'
import { CaseDto } from '../../models/Case'
import { CaseCommentDto } from '../../models/CaseComment'
import { CaseCommentsDto } from '../../models/CaseComments'
import { CaseCommentTaskDto } from '../../models/CaseCommentTask'
import { CaseCommentTitleDto } from '../../models/CaseCommentTitle'
import { CaseCommentTypeDto } from '../../models/CaseCommentType'
import { ICaseCommentService } from './comment.service.interface'

const LOGGING_CATEGORY = 'CaseCommentService'

@Injectable()
export class CaseCommentService implements ICaseCommentService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(CaseDto) private caseModel: typeof CaseDto,
    @Inject(CaseCommentsDto) private caseCommentsModel: typeof CaseCommentsDto,
    @Inject(CaseCommentDto) private caseCommentModel: typeof CaseCommentDto,

    @Inject(CaseCommentTaskDto)
    private caseCommentTaskModel: typeof CaseCommentTaskDto,

    @Inject(CaseCommentTitleDto)
    private caseCommentTitleModel: typeof CaseCommentTitleDto,

    @Inject(CaseCommentTypeDto)
    private caseCommentTypeModel: typeof CaseCommentTypeDto,
  ) {
    this.logger.info('Using CaseCommentSerivce')
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

    const found = await this.caseCommentsModel.findAll({
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
  ): Promise<PostCaseCommentResponse> {
    this.logger.info('Adding comment to application', {
      id: caseId,
      category: LOGGING_CATEGORY,
    })

    const theCase = await this.caseModel.findByPk(caseId)

    if (!theCase) {
      this.logger.warn('Case not found', {
        id: caseId,
        category: LOGGING_CATEGORY,
      })
      throw new NotFoundException('Case not found')
    }

    try {
      const now = new Date().toISOString()

      const theCase = await this.caseModel.findByPk(caseId)

      if (!theCase) {
        throw new NotFoundException('Case not found')
      }

      // find which title to use
      const title = caseCommentTitleMapper(
        mapCaseCommentTypeToCaseCommentTitle(body.type),
      )
      const titleRef = await this.caseCommentTitleModel.findOne({
        where: { value: title },
      })

      if (!titleRef) {
        throw new NotFoundException('Title not found')
      }

      const newCommentType = caseCommentTypeMapper(body.type)

      if (!newCommentType) {
        throw new BadRequestException('Invalid comment type')
      }

      const newCommentRef = await this.caseCommentTypeModel.findOne({
        where: { value: newCommentType },
      })

      if (!newCommentRef) {
        throw new NotFoundException('Comment type not found')
      }

      const newCommentTask = await this.caseCommentTaskModel.create({
        id: uuid(),
        from_id: body.from, // TODO: check if this is correct
        to_id: body.to, // TODO: Use auth service
        comment: body.comment,
        title: titleRef.id,
      })

      const newComment = await this.caseCommentModel.create({
        id: uuid(),
        created_at: now,
        internal: body.internal,
        type: newCommentRef.id,
        case_status: theCase.status,
        task: newCommentTask.id,
      })

      return Promise.resolve({
        comment: caseCommentMigrate(newComment),
      })
    } catch (error) {
      this.logger.error('Failed to create comment', {
        id: caseId,
        category: LOGGING_CATEGORY,
        error,
      })
      throw new BadRequestException('Failed to create comment')
    }
  }

  async deleteComment(
    caseId: string,
    commentId: string,
  ): Promise<DeleteCaseCommentResponse> {
    this.logger.info('Deleting comment from application', {
      caseId,
      commentId,
      category: LOGGING_CATEGORY,
    })

    try {
      const comment = await this.caseCommentModel.destroy({
        where: {
          id: commentId,
        },
      })

      return Promise.resolve({
        success: comment > 0,
      })
    } catch (error) {
      this.logger.error('Failed to delete comment', {
        id: caseId,
        commentId,
        category: LOGGING_CATEGORY,
        error,
      })
      throw new BadRequestException('Failed to delete comment')
    }
  }
}
