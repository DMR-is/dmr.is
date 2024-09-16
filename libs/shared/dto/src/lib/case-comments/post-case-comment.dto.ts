import { ApiProperty } from '@nestjs/swagger'

import { CaseCommentTypeEnum } from './case-comment-constants'

/**
 * Represents the body of a POST request for creating a case comment.
 */
export class PostCaseCommentBody {
  /**
   * Indicates whether the comment is internal.
   */
  @ApiProperty({
    type: Boolean,
    description: 'Is the comment internal',
    required: true,
  })
  internal!: boolean

  /**
   * The type of the comment.
   */
  @ApiProperty({
    enum: CaseCommentTypeEnum,
    description: 'Type of the comment',
    required: true,
  })
  type!: CaseCommentTypeEnum

  /**
   * The content of the comment.
   */
  @ApiProperty({
    type: String,
    description: 'The case comment itself',
    required: true,
  })
  comment!: string | null

  /**
   * The ID of the user or instituion who created the comment.
   */
  @ApiProperty({
    type: String,
    description: 'Id of the user who created the comment',
    required: true,
  })
  initiator!: string | null

  /**
   * The recipient user or institution of the task.
   */
  @ApiProperty({
    type: String,
    description: 'To whom or what the task is assigned to.',
    required: false,
  })
  receiver!: string | null

  /**
   * Indicates whether the state of the application should be stored.
   */
  @ApiProperty({
    type: Boolean,
    description: 'Store the state of the application',
    required: false,
  })
  storeState?: boolean
}
