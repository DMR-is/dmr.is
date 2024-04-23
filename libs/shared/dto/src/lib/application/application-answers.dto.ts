import { ApiProperty } from '@nestjs/swagger'

enum ApplicationAnswerOption {
  YES = 'yes',
  NO = 'no',
}

export class ApplicationRequirements {
  @ApiProperty({
    enum: ApplicationAnswerOption,
    example: ApplicationAnswerOption.YES,
    description: 'Has the applicant approved the requirements',
  })
  approveExternalData?: ApplicationAnswerOption
}

export class ApplicationAdvert {
  @ApiProperty({
    type: String,
    example: 'b783c4d5-6e78-9f01-2g34-h56i7j8k9l0m',
    description: 'Id of the selected department for the application advert',
  })
  department!: string

  @ApiProperty({
    type: String,
    example: 'a71ka2b3-4c56-7d89-0e12-3f45g6h7i8j9',
    description: 'Id of the selected type for the application advert',
  })
  type!: string

  @ApiProperty({
    type: String,
    example: 'GJALDSKRÁ fyrir hundahald í Reykjavík',
    description: 'Title of the application advert',
  })
  title!: string

  @ApiProperty({
    type: String,
    description: 'HTML string of the application advert',
  })
  document!: string

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

class ApplicationSignatureMember {
  @ApiProperty({
    type: String,
    example: 'F.h.r',
    description: 'Text above the name of the signature',
  })
  above?: string

  @ApiProperty({
    type: String,
    example: 'Jón Jónsson',
    description: 'Name of the signature',
  })
  name?: string

  @ApiProperty({
    type: String,
    example: 'ráðherra',
    description: 'Text after the name of the signature',
  })
  after?: string

  @ApiProperty({
    type: String,
    example: 'Text below the name of the signature',
    description: 'borgarstjóri',
  })
  below?: string
}

class ApplicationRegularSignature {
  @ApiProperty({
    type: String,
    example: 'Dómsmálaráðuneytið',
    description: 'Institution/place of the signature',
  })
  institution!: string

  @ApiProperty({
    type: String,
    example: '2021-04-01T00:00:00.000Z',
    description: 'Date of the signature',
  })
  date!: string

  @ApiProperty({
    type: [ApplicationSignatureMember],
    description: 'Member of the signature',
  })
  members?: ApplicationSignatureMember[]
}

class ApplicationCommitteeSignature {
  @ApiProperty({
    type: String,
    example: 'Dómsmálaráðuneytið',
    description: 'Institution/place of the signature',
  })
  institution!: string

  @ApiProperty({
    type: String,
    example: '2021-04-01T00:00:00.000Z',
    description: 'Date of the signature',
  })
  date!: string

  chairmain?: ApplicationSignatureMember

  @ApiProperty({
    type: [ApplicationSignatureMember],
    description: 'Member of the signature',
  })
  members?: ApplicationSignatureMember[]
}

export class ApplicationSignature {
  @ApiProperty({
    type: String,
    example: 'committee',
    description: 'Signature type of the application',
  })
  type?: string

  @ApiProperty({
    type: String,
    example: '<p>Jón Jónsson</p>',
    description: 'HTML string of the signature',
  })
  signature?: string

  @ApiProperty({
    type: String,
    example: 'Dagur B. Eggertsson',
    description: 'Additional name of the signature',
  })
  additional?: string

  @ApiProperty({
    type: [ApplicationRegularSignature],
    description: 'Regular signature of the application',
  })
  regular?: ApplicationRegularSignature[]

  @ApiProperty({
    type: ApplicationCommitteeSignature,
    description: 'Committee signature of the application',
  })
  committee?: ApplicationCommitteeSignature
}

class ApplicationAttachmentsFileSchema {
  @ApiProperty({
    type: String,
    example: 'filename.doc',
    description: 'Name of the attachment',
  })
  name!: string

  @ApiProperty({
    type: String,
    example: 'key',
    description: 'Key of the attachment',
  })
  key!: string

  @ApiProperty({
    type: String,
    example: 'https://example.com/document.pdf',
    description: 'URL of the attachment',
  })
  url?: string
}

export class ApplicationAttachments {
  @ApiProperty({
    type: [ApplicationAttachmentsFileSchema],
    description: 'List of attachments',
  })
  files?: ApplicationAttachmentsFileSchema[]

  @ApiProperty({
    type: String,
    example: 'document',
    description:
      'Selected department for the application attachment, should be "document" or "additions"',
  })
  fileNames?: string
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
  date!: string

  @ApiProperty({
    enum: ApplicationAnswerOption,
    example: ApplicationAnswerOption.YES,
    description: 'Request fast track for the advert',
  })
  fastTrack!: ApplicationAnswerOption

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

export class ApplicationAnswers {
  @ApiProperty({
    type: ApplicationRequirements,
    example: 'true',
    description: 'Has the applicant approved the external data',
  })
  requirements?: ApplicationRequirements

  @ApiProperty({
    type: ApplicationAdvert,
    description: 'Application advert',
  })
  advert?: ApplicationAdvert

  @ApiProperty({
    type: ApplicationSignature,
    description: 'Application signature',
  })
  signature?: ApplicationSignature

  @ApiProperty({
    type: ApplicationAttachments,
    description: 'Application attachments',
  })
  attachments?: ApplicationAttachments

  @ApiProperty({
    type: ApplicationPublishing,
    description: 'Application publishing',
  })
  publishing?: ApplicationPublishing
}
