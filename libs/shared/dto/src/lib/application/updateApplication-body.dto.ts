import { ApiProperty } from '@nestjs/swagger'

import { ApplicationAnswers } from './application-answers.dto'

export class UpdateApplicationBody {
  @ApiProperty({
    type: ApplicationAnswers,
    example: {},
    description: 'Answers to the application questions.',
  })
  answers!: ApplicationAnswers
}
