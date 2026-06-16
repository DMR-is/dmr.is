import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { CompanyCommentDto } from '../company/dto/company-comment.dto'
import { CompanyModel } from '../company/models/company.model'
import { CompanyCommentModel } from '../company/models/company-comment.model'
import { UserModel } from '../user/models/user.model'
import { CreateCompanyCommentDto } from './dto/create-company-comment.dto'
import { ICompanyCommentService } from './company-comment.service.interface'

const LOGGING_CONTEXT = 'CompanyCommentService'

@Injectable()
export class CompanyCommentService implements ICompanyCommentService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(CompanyCommentModel)
    private readonly companyCommentModel: typeof CompanyCommentModel,
    @InjectModel(CompanyModel)
    private readonly companyModel: typeof CompanyModel,
  ) {}

  async getByCompanyId(companyId: string): Promise<CompanyCommentDto[]> {
    this.logger.debug(`Getting comments for company ${companyId}`, {
      context: LOGGING_CONTEXT,
    })

    const comments = await this.companyCommentModel.findAll({
      where: { companyId },
      order: [['createdAt', 'ASC']],
      include: [{ model: UserModel, as: 'author', required: false }],
    })

    return comments.map((comment) => comment.fromModel())
  }

  async create(
    companyId: string,
    authorUserId: string,
    dto: CreateCompanyCommentDto,
  ): Promise<CompanyCommentDto> {
    this.logger.info(`Creating comment for company ${companyId}`, {
      context: LOGGING_CONTEXT,
    })

    const body = dto.body.trim()

    if (!body) {
      throw new BadRequestException('Comment body cannot be empty')
    }

    // Resolve the company first so a bad id is a clean 404 rather than an FK
    // violation surfacing as a 500.
    await this.companyModel.findOneOrThrow(
      { where: { id: companyId } },
      `Company "${companyId}" not found`,
    )

    const comment = await this.companyCommentModel.create({
      companyId,
      authorUserId,
      body,
    })

    // Reload with the author so the response carries authorName (the freshly
    // created instance has no association loaded).
    await comment.reload({
      include: [{ model: UserModel, as: 'author', required: false }],
    })

    return comment.fromModel()
  }

  async delete(companyId: string, commentId: string): Promise<void> {
    this.logger.info(
      `Deleting comment ${commentId} for company ${companyId}`,
      { context: LOGGING_CONTEXT },
    )

    const comment = await this.companyCommentModel.findOneOrThrow(
      { where: { id: commentId, companyId } },
      `Comment "${commentId}" not found`,
    )

    await comment.destroy()
  }
}
