import { IsOptional } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { ApplicationCommunicationChannel } from './application-advert'
export class ApplicationAdvert {
  @ApiProperty({
    type: String,
    example: 'b783c4d5-6e78-9f01-2g34-h56i7j8k9l0m',
    description: 'Id of the selected department for the application advert',
  })
  @IsOptional()
  departmentId?: string

  @ApiProperty({
    type: String,
    example: 'a71ka2b3-4c56-7d89-0e12-3f45g6h7i8j9',
    description: 'Id of the selected type for the application advert',
  })
  @IsOptional()
  typeId?: string

  @ApiProperty({
    type: String,
    example: 'GJALDSKRÁ fyrir hundahald í Reykjavík',
    description: 'Title of the application advert',
  })
  @IsOptional()
  title?: string

  @ApiProperty({
    type: String,
    example: 'a12c3d4e-5f67-8h90-1i23-j45k6l7m8n9o0',
    description: 'HTML contents of the advert',
  })
  @IsOptional()
  html?: string

  @ApiProperty({
    type: String,
    example: '2021-04-01T00:00:00.000Z',
    description: 'Request advert publcation date',
  })
  @IsOptional()
  requestedDate?: string

  @ApiProperty({
    type: [String],
  })
  @IsOptional()
  categories?: string[]

  @ApiProperty({
    type: String,
    example: 'Some message to the admins',
    description: 'Message to the admins of the advert',
  })
  message?: string

  @ApiProperty({
    type: [ApplicationCommunicationChannel],
    description: 'Communication channels',
  })
  @IsOptional()
  channels?: ApplicationCommunicationChannel[]
}

export class UpdateApplicationAnswersBody {
  @ApiProperty({
    type: ApplicationAdvert,
    description: 'Application advert',
  })
  advert?: ApplicationAdvert
}
