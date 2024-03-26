import { ApiProperty } from '@nestjs/swagger'
import {
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator'
import { CaseStatus } from './case-constants'

export class CasesQuery {
  @ApiProperty({
    name: 'search',
    type: Number,
    description: 'String to search for in cases.',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string

  @ApiProperty({
    name: 'page',
    type: Number,
    description: 'Page number',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  page?: number

  @ApiProperty({
    name: 'caseNumber',
    description:
      'Case number to filter on, takes into account `caseNumber` on `Case`.',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  caseNumber?: string

  @ApiProperty({
    enum: CaseStatus,
    name: 'status',
    description:
      'Status to filter cases on, takes into account `status` on `Case`.',
    required: false,
  })
  @IsOptional()
  @IsString()
  status?: string

  @ApiProperty({
    name: 'employeeId',
    description:
      'Id of the employee to filter cases on, takes into account `employeeId` on `Case` and `CaseComment`.',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  employeeId?: string

  @ApiProperty({
    name: 'published',
    description:
      'Boolean to filter cases on, takes into account `published` on `Case`.',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  published?: boolean

  @ApiProperty({
    name: 'fastTrack',
    description:
      'Boolean to filter cases on, takes into account `fastTrack` on `Case`.',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  fastTrack?: boolean

  @ApiProperty({
    name: 'institution',
    description:
      'Institution to filter cases on, takes into account `institution` on `Case`.',
    type: Date,
    required: false,
  })
  @IsOptional()
  @IsString()
  institution?: string

  @ApiProperty({
    name: 'dateFrom',
    description:
      'Date from which to filter adverts on, inclusive, takes into account `createdDate`, `updatedDate` and `signatureDate`.',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string

  @ApiProperty({
    name: 'dateTo',
    description:
      'Date to which to filter adverts on, inclusive, takes into account `createdDate`, `updatedDate` and `signatureDate`.',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dateTo?: string
}
