import { ApiProperty } from '@nestjs/swagger'
import { IsString, ValidateIf } from 'class-validator'

export class CaseTask {
  @ApiProperty({
    type: String,
    description:
      'From who or what initied the task, used by client to show who inited the task.',
    examples: ['Ármann', 'Pálina J'],
  })
  @ValidateIf((o) => o.from !== null)
  @IsString()
  from!: string | null

  @ApiProperty({
    type: String,
    description: 'To whom or what the task is assigned to.',
    examples: ['Ármann', 'Yfirlestur', 'Tilbúið til útgáfu'],
  })
  to!: string | null
}
