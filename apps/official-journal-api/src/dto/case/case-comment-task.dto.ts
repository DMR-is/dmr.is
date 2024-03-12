import { ApiProperty } from '@nestjs/swagger'
import { IsString, ValidateIf } from 'class-validator'

export class CaseCommentTask {
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
  @ValidateIf((o) => o.to !== null)
  @IsString()
  to!: string | null

  @ApiProperty({
    type: String,
    examples: ['gerir athugasemd', 'færir mál á', 'uppfærir stöðu:'],
    description: 'The task title',
  })
  @IsString()
  title!: string

  @ApiProperty({
    type: String,
    description: 'The comment itself',
    examples: [
      'Pálína, getur þú tekið við og staðfest að upplýsingarnar séu réttar?',
      'Það er eitthvað bogið við þetta, hætti við útgáfu.',
    ],
  })
  @ValidateIf((o) => o.comment !== null)
  @IsString()
  comment!: string | null
}
