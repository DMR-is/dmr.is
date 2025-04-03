import { ApiProperty } from '@nestjs/swagger'

import { UpdateApplicationAnswersBody } from './update-application.answers.dto'

export class UpdateApplicationBody {
  @ApiProperty({
    type: UpdateApplicationAnswersBody,
    example: {},
    description: 'Answers to the application questions.',
  })
  answers!: UpdateApplicationAnswersBody
}
