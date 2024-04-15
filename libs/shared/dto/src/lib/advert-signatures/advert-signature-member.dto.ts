import { ApiProperty } from '@nestjs/swagger'

export class AdvertSignatureMember {
  @ApiProperty({
    description: 'Marks the members as chairman or not',
    example: true,
    required: true,
    nullable: false,
    type: Boolean,
  })
  isChairman!: boolean | null

  @ApiProperty({
    description: 'Name of the committee chairman',
    example: 'Dagur B. Eggertsson',
    required: true,
    type: String,
  })
  name!: string

  @ApiProperty({
    description: 'Text above the name of the signature',
    example: 'F.h.r',
    required: false,
    nullable: true,
    type: String,
  })
  textAbove!: string | null

  @ApiProperty({
    description: 'Text after the name of the signature',
    example: 'formaður',
    required: false,
    nullable: true,
    type: String,
  })
  textAfter!: string | null

  @ApiProperty({
    description: 'Text above the name of the signature',
    example: 'borgarstjóri',
    required: false,
    nullable: true,
    type: String,
  })
  textBelow!: string | null
}
