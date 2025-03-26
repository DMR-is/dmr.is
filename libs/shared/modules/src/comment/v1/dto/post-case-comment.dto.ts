import { ApiProperty } from '@nestjs/swagger'

import {
  CaseCommentSourceEnum,
  CaseCommentTypeTitleEnum,
} from './case-comment-constants'

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

  @ApiProperty({
    enum: CaseCommentTypeTitleEnum,
    enumName: 'CaseCommentType',
    required: true,
  })
  type!: CaseCommentTypeTitleEnum

  @ApiProperty({
    enum: CaseCommentSourceEnum,
    enumName: 'CaseCommentSource',
    required: true,
  })
  source!: CaseCommentSourceEnum

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
   * The creator of the comment
   */
  @ApiProperty({
    type: String,
    required: true,
  })
  creator!: string | null

  /**
   * The receiver of the comment
   */
  @ApiProperty({
    type: String,
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
