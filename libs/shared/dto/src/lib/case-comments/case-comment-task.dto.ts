import { IsEnum, IsString, ValidateIf } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { CaseCommentTitle } from './case-comment-constants'

export class CaseCommentTask {
  @ApiProperty({
    type: String,
    description:
      'From who or what initied the task, used by client to show who inited the task.',
    example: 'Ármann',
  })
  @ValidateIf((o) => o.from !== null)
  @IsString()
  from!: string | null

  @ApiProperty({
    type: String,
    description: 'To whom or what the task is assigned to.',
    example: 'Pálina J',
  })
  @ValidateIf((o) => o.to !== null)
  @IsString()
  to!: string | null

  @ApiProperty({
    enum: CaseCommentTitle,
    example: CaseCommentTitle.Submit,
    description: 'Title for the task action',
  })
  @IsEnum(CaseCommentTitle)
  title!: CaseCommentTitle

  @ApiProperty({
    type: String,
    description: 'The comment itself',
    example:
      'Pálína, getur þú tekið við og staðfest að upplýsingarnar séu réttar?',
  })
  @ValidateIf((o) => o.comment !== null)
  @IsString()
  comment!: string | null
}
