import { CaseActionEnum, CaseStatus } from '@dmr.is/shared/dto'

import { ApiProperty, PickType } from '@nestjs/swagger'

export class CommentDto {
  @ApiProperty({
    type: String,
    description: 'The id of the comment',
  })
  id!: string

  @ApiProperty({
    type: String,
    description: 'ISO string of the age of the comment',
  })
  ageIso!: string

  @ApiProperty({
    enum: CaseActionEnum,
    enumName: 'CaseActionEnum',
    description: 'The action that created the comment',
  })
  action!: CaseActionEnum

  @ApiProperty({
    type: CaseStatus,
    description: 'The status of the case when the comment was created',
  })
  status!: CaseStatus

  @ApiProperty({
    type: String,
    description: 'The creator of the comment',
  })
  creator!: string

  @ApiProperty({
    description: 'The receiver of the comment',
    type: String,
    nullable: true,
  })
  receiver?: string

  @ApiProperty({
    type: String,
    description: 'The comment',
    nullable: true,
  })
  comment?: string
}

class CommentFields {
  @ApiProperty({
    type: String,
    description:
      'Should be passed if the comment is created by an application user',
  })
  applicationUserCreatorId?: string

  @ApiProperty({
    type: String,
    description:
      'Should be passed when an admin user is responsible for the action taken',
  })
  adminUserCreatorId?: string

  @ApiProperty({
    type: String,
    description:
      'Should be passed when an institution is responsible for the action taken',
  })
  institutionCreatorId?: string

  @ApiProperty({
    type: String,
    description:
      'Should be passed when an case status is receiving the action taken',
  })
  caseStatusReceiverId?: string

  @ApiProperty({
    type: String,
    description:
      'Should be passed when an admin user is receiving the action taken',
  })
  adminUserReceiverId?: string

  @ApiProperty({
    type: String,
  })
  comment?: string
}

export class SubmitCommentBody extends PickType(CommentFields, [
  'institutionCreatorId',
]) {}

export class AssignUserCommentBody extends PickType(CommentFields, [
  'adminUserCreatorId',
  'adminUserReceiverId',
]) {}

export class AssignSelfCommentBody extends PickType(CommentFields, [
  'adminUserCreatorId',
]) {}

export class UpdateStatusCommentBody extends PickType(CommentFields, [
  'adminUserCreatorId',
  'caseStatusReceiverId',
]) {}

export class InternalCommentBody extends PickType(CommentFields, [
  'adminUserCreatorId',
  'comment',
]) {}

export class ExternalCommentBody extends PickType(CommentFields, [
  'adminUserCreatorId',
  'comment',
]) {}

export class ApplicationCommentBody extends PickType(CommentFields, [
  'applicationUserCreatorId',
  'comment',
]) {}
