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
import { caseCommentsMigrate } from '../../../util/migrations/case/case-comments-migrate'
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
    this.logger.info('Getting comment for case', {
      caseId,
      commentId,
      category: LOGGING_CATEGORY,
    })

    try {
      const comment = await this.caseCommentModel.findOne({
        where: { id: commentId },
        nest: true,
        include: [
          CaseCommentTypeDto,
          CaseStatusDto,
          { model: CaseCommentTaskDto, include: [CaseCommentTitleDto] },
        ],
        logging: (sql) => this.logger.info(sql),
      })

      if (!comment) {
        return Promise.resolve({
          comment: null,
        })
      }

      const migrated = caseCommentMigrate(comment)

      return Promise.resolve({
        comment: migrated,
      })
    } catch (error) {
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
          where: { case_case_id: caseId },
          logging: (sql) => this.logger.info(sql),
          include: [
            {
              model: CaseCommentDto,
              include: [
                CaseCommentTypeDto,
                CaseStatusDto,
                { model: CaseCommentTaskDto, include: [CaseCommentTitleDto] },
              ],
            },
          ],
        })
        .then((data) => {
          return data
        })

      const comments = found
        .map((c) => caseCommentMigrate(c.caseComment))
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
    this.logger.info('postComment', {
      caseId: caseId,
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

      const theCase = await this.caseModel.findOne({
        where: { id: caseId },
        include: [CaseStatusDto],
      })

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

      const newCommentTypeRef = await this.caseCommentTypeModel.findOne({
        where: { value: newCommentType },
      })

      if (!newCommentTypeRef) {
        throw new NotFoundException('Comment type not found')
      }

      const newCommentTask = await this.caseCommentTaskModel.create({
        id: uuid(),
        comment: body.comment,
        fromId: body.from,
        toId: body.to,
        titleId: titleRef.id,
      })

      const newComment = await this.caseCommentModel.create(
        {
          id: uuid(),
          createdAt: now,
          internal: body.internal,
          typeId: newCommentTypeRef.id,
          statusId: theCase.statusId,
          taskId: newCommentTask.id,
        },
        {
          returning: true,
          logging: (sql) => this.logger.info(sql),
        },
      )

      // adding row to relation table
      await this.caseCommentsModel.create({
        caseId: caseId,
        commentId: newComment.id,
      })

      const withRelations = await this.caseCommentModel.findByPk(
        newComment.id,
        {
          nest: true,
          include: [
            CaseCommentTypeDto,
            CaseStatusDto,
            { model: CaseCommentTaskDto, include: [CaseCommentTitleDto] },
          ],
        },
      )

      if (!withRelations) {
        throw new NotFoundException('Could not create comment')
      }

      return Promise.resolve({
        comment: caseCommentMigrate(withRelations),
      })
    } catch (error) {
      this.logger.error('Error in postComment', {
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

    // check if case and comment exists
    const exists = await this.caseCommentsModel.findOne({
      where: {
        caseId,
        commentId,
      },
    })

    if (!exists) {
      this.logger.warn('Trying to delete comment that does not exist on case', {
        caseId,
        commentId,
        category: LOGGING_CATEGORY,
      })
      return Promise.resolve({
        success: false,
      })
    }

    try {
      // delete from relation table
      await this.caseCommentsModel.destroy({
        where: {
          caseId,
          commentId,
        },
      })

      // delete from comment table
      await this.caseCommentModel.destroy({
        where: {
          id: commentId,
        },
      })

      return Promise.resolve({
        success: true,
      })
    } catch (error) {
      this.logger.error('Error in deleteComment', {
        caseId,
        commentId,
        category: LOGGING_CATEGORY,
        error,
      })
      return Promise.resolve({
        success: false,
      })
    }
  }
}
