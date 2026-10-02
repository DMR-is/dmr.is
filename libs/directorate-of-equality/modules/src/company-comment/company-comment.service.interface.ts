import { CompanyCommentDto } from '../company/dto/company-comment.dto'
import { CreateCompanyCommentDto } from './dto/create-company-comment.dto'

export interface ICompanyCommentService {
  /** All non-deleted comments for a company, oldest first. */
  getByCompanyId(companyId: string): Promise<CompanyCommentDto[]>

  /** Adds an admin-internal note authored by `authorUserId`. */
  create(
    companyId: string,
    authorUserId: string,
    dto: CreateCompanyCommentDto,
  ): Promise<CompanyCommentDto>

  /**
   * Soft-deletes a comment on the given company. Only its author may: system
   * notes and other reviewers' notes are refused.
   */
  delete(
    companyId: string,
    commentId: string,
    actorUserId: string,
  ): Promise<void>
}

export const ICompanyCommentService = Symbol('ICompanyCommentService')
