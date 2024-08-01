import { Transaction } from 'sequelize'
import { v4 as uuid } from 'uuid'
import { LogAndHandle, Transactional } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  CaseCommentPublicity,
  CaseCommentTitle,
  GetCaseCommentResponse,
  GetCaseCommentsQuery,
  GetCaseCommentsResponse,
  PostCaseCommentBody,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'
import { mapCommentTypeToTitle } from '@dmr.is/utils'

import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { IApplicationService } from '../application/application.service.interface'
import { CaseStatusDto } from '../case/models'
import { caseCommentMigrate } from '../helpers'
import { IUtilityService } from '../utility/utility.module'
import { CaseCommentDto } from './models/CaseComment'
import { CaseCommentsDto } from './models/CaseComments'
import { CaseCommentTaskDto } from './models/CaseCommentTask'
import { CaseCommentTitleDto } from './models/CaseCommentTitle'
import { CaseCommentTypeDto } from './models/CaseCommentType'
import { ICommentService } from './comment.service.interface'
import { CASE_COMMENTS_RELATIONS } from './relations'

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

  @LogAndHandle()
  private async caseCommentTitleLookup(
    type: string | CaseCommentTitle,
    transaction?: Transaction,
  ): Promise<ResultWrapper<CaseCommentTitleDto>> {
    const title = await this.caseCommentTitleModel.findOne({
      where: { value: type },
      transaction,
    })

    if (!title) {
      throw new NotFoundException(`No title found for type<${type}>`)
    }

    return ResultWrapper.ok(title)
  }

  @LogAndHandle()
  private async caseCommentTypeLookup(
    type: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<CaseCommentTypeDto>> {
    const commentType = await this.caseCommentTypeModel
      .findOne({
        where: { value: type },
        transaction,
      })
      .catch((err) => {
        this.logger.error('Error looking up comment type', err)
        throw err
      })

    if (!commentType) {
      throw new NotFoundException(`No type found for type<${type}>`)
    }

    return ResultWrapper.ok(commentType)
  }

  @LogAndHandle()
  async getComment(
    caseId: string,
    commentId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetCaseCommentResponse>> {
    const comment = await this.caseCommentsModel.findOne({
      where: { caseId: caseId, commentId: commentId },
      include: CASE_COMMENTS_RELATIONS,
      transaction,
    })

    if (!comment) {
      throw new NotFoundException(
        `Comment<${commentId}> not found for case<${caseId}>`,
      )
    }

    const migrated = caseCommentMigrate(comment.caseComment)

    return ResultWrapper.ok({
      comment: migrated,
    })
  }

  @LogAndHandle()
  async getComments(
    caseId: string,
    params?: GetCaseCommentsQuery,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetCaseCommentsResponse>> {
    // TODO: Check if requestee has access to internal comments
    const onlyInternal =
      params?.type === CaseCommentPublicity.External ? false : true

    const comments = await this.caseCommentsModel.findAll({
      where: { case_case_id: caseId, internal: !onlyInternal },
      include: CASE_COMMENTS_RELATIONS,
      transaction,
    })

    const migrated = comments.map((comment) =>
      caseCommentMigrate(comment.caseComment),
    )

    return ResultWrapper.ok({
      comments: migrated,
    })
  }

  @LogAndHandle()
  @Transactional()
  async createComment(
    caseId: string,
    body: PostCaseCommentBody,
    storeState = false,
    transaction?: Transaction,
  ): Promise<void> {
    const activeCase = (
      await this.utilityService.caseLookup(caseId, transaction)
    ).unwrap()

    const mappedTitle = mapCommentTypeToTitle(body.type)

    const title = (
      await this.caseCommentTitleLookup(mappedTitle, transaction)
    ).unwrap()

    const newCommentTypeRef = await this.caseCommentTypeModel.findOne({
      where: { value: body.type },
      transaction: transaction,
    })

    if (!newCommentTypeRef) {
      throw new NotFoundException(`No type found for type<${body.type}>`)
    }

    const newCommentTask = await this.caseCommentTaskModel.create(
      {
        id: uuid(),
        comment: body.comment,
        fromId: body.from,
        toId: body.to,
        titleId: title.id,
      },
      {
        transaction: transaction,
      },
    )

    let state: string | null = null
    if (storeState) {
      const applicationRes = (
        await this.applicationService.getApplication(activeCase.applicationId)
      ).unwrap()

      const { application } = applicationRes

      state = JSON.stringify(application)
    }

    const newComment = await this.caseCommentModel.create(
      {
        internal: body.internal,
        typeId: newCommentTypeRef.id,
        statusId: activeCase.statusId,
        taskId: newCommentTask.id,
        state: state,
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
      throw new NotFoundException(`Comment<${newComment.id}> not found`)
    }
  }

  @LogAndHandle()
  @Transactional()
  async deleteComment(
    caseId: string,
    commentId: string,
    transaction?: Transaction,
  ): Promise<void> {
    // check if case and comment exists
    const exists = await this.caseCommentsModel.findOne({
      where: {
        caseId,
        commentId,
      },
      include: [CaseCommentDto],
      transaction,
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
  }
}
