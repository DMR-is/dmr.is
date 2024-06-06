import { Transaction } from 'sequelize'
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
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { IApplicationService } from '../application/application.service.interface'
import { CaseDto, CaseStatusDto } from '../case/models'
import { Audit } from '../decorators/audit.decorator'
import { HandleException } from '../decorators/handle-exception.decorator'
import {
  caseCommentMigrate,
  caseCommentTitleMapper,
  caseCommentTypeMapper,
} from '../helpers'
import { handleNotFoundLookup } from '../lib/utils'
import { Result } from '../types/result'
import { CaseCommentDto } from './models/CaseComment'
import { CaseCommentsDto } from './models/CaseComments'
import { CaseCommentTaskDto } from './models/CaseCommentTask'
import { CaseCommentTitleDto } from './models/CaseCommentTitle'
import { CaseCommentTypeDto } from './models/CaseCommentType'
import { ICommentService } from './comment.service.interface'

const LOGGING_CATEGORY = 'CaseCommentService'

@Injectable()
export class CommentService implements ICommentService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,

    @Inject(forwardRef(() => IApplicationService))
    private applicationService: IApplicationService,
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

  @Audit()
  @HandleException()
  async comment(
    caseId: string,
    commentId: string,
  ): Promise<Result<GetCaseCommentResponse>> {
    const comment = await this.caseCommentModel.findOne({
      where: { id: commentId },
      nest: true,
      include: [
        CaseCommentTypeDto,
        CaseStatusDto,
        { model: CaseCommentTaskDto, include: [CaseCommentTitleDto] },
      ],
    })

    if (!comment) {
      return handleNotFoundLookup({
        id: commentId,
        category: LOGGING_CATEGORY,
        entity: 'comment',
        method: 'comment',
        info: {
          caseId,
          commentId,
        },
      })
    }

    const migrated = caseCommentMigrate(comment)

    return {
      ok: true,
      value: {
        comment: migrated,
      },
    }
  }

  async comments(
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

      const found = await this.caseCommentsModel.findAll({
        where: { case_case_id: caseId },
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

  async create(
    caseId: string,
    body: PostCaseComment,
    transaction?: Transaction,
  ): Promise<PostCaseCommentResponse> {
    this.logger.info('postComment', {
      caseId: caseId,
      category: LOGGING_CATEGORY,
    })

    try {
      const now = new Date().toISOString()

      const theCase = await this.caseModel.findOne({
        where: { id: caseId },
        include: [CaseStatusDto],
        transaction: transaction,
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
        transaction: transaction,
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
        transaction: transaction,
      })

      if (!newCommentTypeRef) {
        throw new NotFoundException('Comment type not found')
      }

      const newCommentTask = await this.caseCommentTaskModel.create(
        {
          id: uuid(),
          comment: body.comment,
          fromId: body.from,
          toId: body.to,
          titleId: titleRef.id,
        },
        {
          transaction: transaction,
        },
      )

      const applicationRes = await this.applicationService.getApplication(
        theCase.applicationId,
      )

      if (!applicationRes.ok) {
        throw new InternalServerErrorException('Could not add comment to case')
      }
      const { application } = applicationRes.value

      const newComment = await this.caseCommentModel.create(
        {
          id: uuid(),
          createdAt: now,
          internal: body.internal,
          typeId: newCommentTypeRef.id,
          statusId: theCase.statusId,
          taskId: newCommentTask.id,
          state: JSON.stringify(application),
        },
        {
          returning: true,
          transaction: transaction,
        },
      )

      // adding row to relation table
      await this.caseCommentsModel.create(
        {
          caseId: caseId,
          commentId: newComment.id,
        },
        {
          transaction: transaction,
        },
      )

      const withRelations = await this.caseCommentModel.findByPk(
        newComment.id,
        {
          nest: true,
          include: [
            CaseCommentTypeDto,
            CaseStatusDto,
            { model: CaseCommentTaskDto, include: [CaseCommentTitleDto] },
          ],
          transaction: transaction,
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

  async delete(
    caseId: string,
    commentId: string,
  ): Promise<DeleteCaseCommentResponse | null> {
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
      include: [CaseCommentDto],
    })

    if (!exists) {
      this.logger.warn('Trying to delete comment that does not exist on case', {
        caseId,
        commentId,
        category: LOGGING_CATEGORY,
      })

      return null
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

      await this.caseCommentTaskModel.destroy({
        where: {
          id: exists.caseComment.taskId,
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
