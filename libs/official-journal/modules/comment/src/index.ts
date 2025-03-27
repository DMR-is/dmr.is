// dto
export {
  ApplicationCommentBody,
  AssignSelfCommentBody,
  AssignUserCommentBody,
  CommentCreatorDto,
  CommentDto,
  CommentReceiverDto,
  ExternalCommentBody,
  ExternalCommentBodyDto,
  GetComment,
  GetComments,
  GetCommentsQuery,
  InternalCommentBody,
  InternalCommentBodyDto,
  SubmitCommentBody,
  UpdateStatusCommentBody,
} from './lib/dto/comment.dto'

// migrations
export { commentMigrate } from './lib/migrations/comment.migrate'

// services
export { CommentService } from './lib/comment.service'
export { ICommentService } from './lib/comment.service.interface'

// module
export { CommentModule } from './lib/comment.module'
