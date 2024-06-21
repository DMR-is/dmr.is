import { ApiProperty } from '@nestjs/swagger'

export class ApplicationAdvert {
  @ApiProperty({
    type: String,
    example: 'b783c4d5-6e78-9f01-2g34-h56i7j8k9l0m',
    description: 'Id of the selected department for the application advert',
  })
  department?: string

  @ApiProperty({
    type: String,
    example: 'a71ka2b3-4c56-7d89-0e12-3f45g6h7i8j9',
    description: 'Id of the selected type for the application advert',
  })
  type?: string

  @ApiProperty({
    type: String,
    example: 'GJALDSKRÁ fyrir hundahald í Reykjavík',
    description: 'Title of the application advert',
  })
  title?: string

  @ApiProperty({
    type: String,
    description: 'HTML string of the application advert',
  })
  document?: string

  @ApiProperty({
    type: String,
    description: 'Selected template for the application advert',
  })
  template?: string

  @ApiProperty({
    type: String,
    example: 'b781ks2-3c45-6d78-9e01-2f34g5h6i7j8',
    description:
      'Id of the selected subType for the application advert, only when type is "Reglugerð"',
  })
  subType?: string
}

class ApplicationContentCategories {
  @ApiProperty({
    type: String,
    example: 'Gæludýr',
    description: 'Label of the category',
  })
  label!: string

  @ApiProperty({
    type: String,
    example: 'b619j2k3-4l56-7m89-0n12-3o45p6q7r8s9',
    description: 'Id of the selected category',
  })
  value!: string
}

class ApplicationCommunicationChannels {
  @ApiProperty({
    type: String,
    example: 'email',
    description: 'Selected communication channel',
  })
  email!: string

  @ApiProperty({
    type: String,
    example: '5555555',
    description: 'Phone number of the communication channel',
  })
  phone!: string
}

export class ApplicationPublishing {
  @ApiProperty({
    type: String,
    example: '2021-04-01T00:00:00.000Z',
    description: 'Requested publishing date',
  })
  date?: string

  @ApiProperty({
    type: [ApplicationContentCategories],
    description: 'List of selected categories',
  })
  contentCategories?: ApplicationContentCategories[]

  @ApiProperty({
    type: [ApplicationCommunicationChannels],
    description: 'Selected communication channels',
  })
  communicationChannels?: ApplicationCommunicationChannels[]

  @ApiProperty({
    type: String,
    example: 'Some message..',
    description: 'Message for the publisher',
  })
  message?: string
}

export class UpdateApplicationAnswersBody {
  @ApiProperty({
    type: ApplicationAdvert,
    description: 'Application advert',
  })
  advert?: ApplicationAdvert

  @ApiProperty({
    type: ApplicationPublishing,
    description: 'Application publishing',
  })
  publishing?: ApplicationPublishing
}
