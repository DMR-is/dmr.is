import { Transaction } from 'sequelize'
import { v4 as uuid } from 'uuid'
import { Audit, HandleException } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  DeleteCaseCommentResponse,
  GetCaseCommentResponse,
  GetCaseCommentsQuery,
  GetCaseCommentsResponse,
  PostCaseComment,
  PostCaseCommentResponse,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'
import { mapCaseCommentTypeToCaseCommentTitle } from '@dmr.is/utils'

import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { IApplicationService } from '../application/application.service.interface'
import { CaseStatusDto } from '../case/models'
import {
  caseCommentMigrate,
  caseCommentTitleMapper,
  caseCommentTypeMapper,
} from '../helpers'
import { caseMigrate } from '../helpers/migrations/case/case-migrate'
import { IUtilityService } from '../utility/utility.module'
import { CaseCommentDto } from './models/CaseComment'
import { CaseCommentsDto } from './models/CaseComments'
import { CaseCommentTaskDto } from './models/CaseCommentTask'
import { CaseCommentTitleDto } from './models/CaseCommentTitle'
import { CaseCommentTypeDto } from './models/CaseCommentType'
import { ICommentService } from './comment.service.interface'

@Injectable()
export class CommentService implements ICommentService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(forwardRef(() => IUtilityService))
    private utilityService: IUtilityService,

    @Inject(forwardRef(() => IApplicationService))
    private applicationService: IApplicationService,
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
  ): Promise<ResultWrapper<GetCaseCommentResponse>> {
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
      throw new NotFoundException(`Comment<${commentId}> not found`)
    }

    const migrated = caseCommentMigrate(comment)

    return ResultWrapper.ok({
      comment: migrated,
    })
  }

  @Audit()
  @HandleException()
  async comments(
    caseId: string,
    params?: GetCaseCommentsQuery,
  ): Promise<ResultWrapper<GetCaseCommentsResponse>> {
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

    return ResultWrapper.ok({
      comments,
    })
  }

  @Audit()
  @HandleException()
  async create(
    caseId: string,
    body: PostCaseComment,
    transaction?: Transaction,
  ): Promise<ResultWrapper<PostCaseCommentResponse>> {
    const now = new Date().toISOString()

    const caseLookup = (
      await this.utilityService.caseLookup(caseId, transaction)
    ).unwrap()

    const theCase = caseMigrate(caseLookup)

    // find which title to use
    const title = caseCommentTitleMapper(
      mapCaseCommentTypeToCaseCommentTitle(body.type),
    )

    const titleRef = await this.caseCommentTitleModel.findOne({
      where: { value: title },
      transaction: transaction,
    })

    if (!titleRef) {
      return ResultWrapper.err({
        code: 404,
        message: 'Title not found',
      })
    }

    const newCommentType = caseCommentTypeMapper(body.type)

    if (!newCommentType) {
      throw new BadRequestException(`Invalid comment type: ${body.type}`)
    }

    const newCommentTypeRef = await this.caseCommentTypeModel.findOne({
      where: { value: newCommentType },
      transaction: transaction,
    })

    if (!newCommentTypeRef) {
      return ResultWrapper.err({
        code: 404,
        message: 'Comment type not found',
      })
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

    const applicationRes = (
      await this.applicationService.getApplication(theCase.applicationId)
    ).unwrap()

    const { application } = applicationRes

    const newComment = await this.caseCommentModel.create(
      {
        id: uuid(),
        createdAt: now,
        internal: body.internal,
        typeId: newCommentTypeRef.id,
        statusId: caseLookup.statusId,
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

    const withRelations = await this.caseCommentModel.findByPk(newComment.id, {
      nest: true,
      include: [
        CaseCommentTypeDto,
        CaseStatusDto,
        { model: CaseCommentTaskDto, include: [CaseCommentTitleDto] },
      ],
      transaction: transaction,
    })

    if (!withRelations) {
      return ResultWrapper.err({
        code: 404,
        message: 'Comment not found',
      })
    }

    return ResultWrapper.ok({
      comment: caseCommentMigrate(withRelations),
    })
  }

  @Audit()
  @HandleException()
  async delete(
    caseId: string,
    commentId: string,
  ): Promise<ResultWrapper<DeleteCaseCommentResponse>> {
    // check if case and comment exists
    const exists = await this.caseCommentsModel.findOne({
      where: {
        caseId,
        commentId,
      },
      include: [CaseCommentDto],
    })

    if (!exists) {
      throw new NotFoundException(`Comment<${commentId}> not found`)
    }

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

    return ResultWrapper.ok({
      success: true,
    })
  }
}
