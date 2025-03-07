import { IsOptional, IsString, MaxLength } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class GetUsersQuery {
  @ApiProperty({
    name: 'search',
    description: 'String to search for user.',
    type: String,
    required: false,
  })
  @MaxLength(1024)
  @IsString()
  @IsOptional()
  search?: string
}
