import { ApiProperty } from '@nestjs/swagger'
import { IsString, Length } from 'class-validator'

export class StatisticsDepartmentQuery {
  @ApiProperty({
    description: 'Id of the department',
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
    required: true,
    type: String,
  })
  @IsString()
  @Length(36, 36)
  id!: string
}
