import { v4 as uuid } from 'uuid'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  DeleteCaseCommentResponse,
  GetCaseCommentResponse,
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
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import {
  caseCommentMigrate,
  caseCommentTitleMapper,
  caseCommentTypeMapper,
} from '../../../util'
import { caseCommentsMigrate } from '../../../util/migrations/case/case-comment-migrate copy'
import { CaseStatusDto } from '../../models'
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
    @InjectModel(CaseDto) private caseModel: typeof CaseDto,
    @InjectModel(CaseCommentsDto)
    private caseCommentsModel: typeof CaseCommentsDto,
    @InjectModel(CaseCommentDto)
    private caseCommentModel: typeof CaseCommentDto,

    @InjectModel(CaseCommentTaskDto)
    private caseCommentTaskModel: typeof CaseCommentTaskDto,

    @InjectModel(CaseCommentTitleDto)
    private caseCommentTitleModel: typeof CaseCommentTitleDto,

    @InjectModel(CaseCommentTypeDto)
    private caseCommentTypeModel: typeof CaseCommentTypeDto,
  ) {
    this.logger.info('Using CaseCommentSerivce')
  }
  async getComment(
    caseId: string,
    commentId: string,
  ): Promise<GetCaseCommentResponse> {
    this.logger.log('Getting comment for case', {
      caseId,
      commentId,
      category: LOGGING_CATEGORY,
    })

    try {
      const comment = await this.caseCommentsModel.findOne({
        where: { case_id: caseId, case_comment_id: commentId },
        include: [CaseCommentDto, CaseDto],
        logging: (msg) => this.logger.info(msg),
      })

      if (!comment) {
        return Promise.resolve({
          comment: null,
        })
      }

      const migrated = caseCommentsMigrate(comment)

      return Promise.resolve({
        comment: migrated.caseComment,
      })
    } catch (error) {
      console.log(error)
      this.logger.error('Error in getComment', {
        caseId,
        commentId,
        category: LOGGING_CATEGORY,
        error,
      })
      throw new InternalServerErrorException('Failed to get comment')
    }
  }

  async getComments(
    caseId: string,
    params?: GetCaseCommentsQuery,
  ): Promise<GetCaseCommentsResponse> {
    this.logger.info('Getting comments for case', {
      id: caseId,
      category: LOGGING_CATEGORY,
    })

    try {
      const onlyExternal = params?.type === 'external'
      const onlyInternal = params?.type === 'internal'

      const found = await this.caseCommentsModel
        .findAll({
          where: { case_id: caseId },
          logging: (msg) => this.logger.debug(msg),
          include: [
            CaseCommentDto,
            { nested: true, model: CaseStatusDto },
            //{ model: CaseStatusDto, as: 'status' },
            // CaseCommentTaskDto,
            // CaseCommentTypeDto,
          ],
        })
        .then((data) => {
          return data
        })

      console.log(found)

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
    } catch (error) {
      console.log(error)
      this.logger.error('Error in getComments', {
        id: caseId,
        category: LOGGING_CATEGORY,
        error,
      })
      throw new InternalServerErrorException('Failed to get comments')
    }
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
