import { ApiProperty } from '@nestjs/swagger'

import { ApplicationAnswers } from './application-answers.dto'
import { ApplicationEvent } from './application-events.dto'

export class SubmitApplicationBody {
  @ApiProperty({
    enum: ApplicationEvent,
    example: ApplicationEvent.APPROVE,
    description: 'Approve or reject the application.',
  })
  event!: ApplicationEvent

  @ApiProperty({
    type: ApplicationAnswers,
    example: {},
    description: 'Answers to the application questions.',
  })
  answers?: ApplicationAnswers
}
