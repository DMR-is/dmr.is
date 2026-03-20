import { Type } from 'class-transformer'
import { IsArray, IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator'

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class RegulationAppendix {
  @ApiProperty({ type: String, description: 'Title of the appendix' })
  @IsString()
  title!: string

  @ApiProperty({ type: String, description: 'HTML content of the appendix' })
  @IsString()
  text!: string
}

export class RegulationLawChapter {
  @ApiProperty({ type: String, description: 'Law chapter name' })
  @IsString()
  name!: string

  @ApiProperty({ type: String, description: 'Law chapter slug' })
  @IsString()
  slug!: string
}

export class RegulationImpact {
  @ApiProperty({ type: String, description: 'Unique impact ID' })
  @IsUUID()
  id!: string

  @ApiProperty({
    type: String,
    description: 'Impact type: amend or repeal',
  })
  @IsString()
  type!: string

  @ApiProperty({
    type: String,
    description: 'RegName of the target regulation',
  })
  @IsString()
  regulation!: string

  @ApiProperty({ type: String, description: 'When this impact takes effect' })
  @IsString()
  date!: string

  @ApiPropertyOptional({ type: String, description: 'Impact section title' })
  @IsString()
  @IsOptional()
  title?: string

  @ApiPropertyOptional({ type: String, description: 'New/replacement text HTML' })
  @IsString()
  @IsOptional()
  text?: string

  @ApiPropertyOptional({
    type: [String],
    description: 'Changed appendix content',
  })
  @IsArray()
  @IsOptional()
  appendixes?: string[]

  @ApiPropertyOptional({ type: String, description: 'Comments about this impact' })
  @IsString()
  @IsOptional()
  comments?: string

  @ApiPropertyOptional({ type: String, description: 'HTML diff showing changes' })
  @IsString()
  @IsOptional()
  diff?: string

  @ApiPropertyOptional({ type: Boolean, description: 'If true, this impact was dropped' })
  @IsBoolean()
  @IsOptional()
  dropped?: boolean
}

export class RegulationDraft {
  @ApiProperty({ type: String, description: 'Regulation draft UUID' })
  @IsUUID()
  id!: string

  @ApiProperty({ type: String, description: 'Drafting status' })
  @IsString()
  draftingStatus!: string

  @ApiProperty({ type: String, description: 'Regulation title' })
  @IsString()
  title!: string

  @ApiProperty({ type: String, description: 'Regulation body HTML' })
  @IsString()
  text!: string

  @ApiPropertyOptional({
    type: [RegulationAppendix],
    description: 'Appendixes with title and HTML content',
  })
  @Type(() => RegulationAppendix)
  @IsArray()
  @IsOptional()
  appendixes?: RegulationAppendix[]

  @ApiPropertyOptional({ type: String, description: 'General comments' })
  @IsString()
  @IsOptional()
  comments?: string

  @ApiPropertyOptional({
    type: String,
    description: 'Regulation name (e.g., "0123/2020")',
  })
  @IsString()
  @IsOptional()
  name?: string

  @ApiPropertyOptional({ type: String, description: 'Internal drafting notes HTML' })
  @IsString()
  @IsOptional()
  draftingNotes?: string

  @ApiPropertyOptional({ type: String, description: 'Desired publication date' })
  @IsString()
  @IsOptional()
  idealPublishDate?: string

  @ApiPropertyOptional({
    type: String,
    description: 'When the regulation takes legal effect',
  })
  @IsString()
  @IsOptional()
  effectiveDate?: string

  @ApiPropertyOptional({ type: String, description: 'Responsible ministry name' })
  @IsString()
  @IsOptional()
  ministry?: string

  @ApiPropertyOptional({ type: String, description: 'Date of signature' })
  @IsString()
  @IsOptional()
  signatureDate?: string

  @ApiPropertyOptional({ type: String, description: 'Rendered signature block HTML' })
  @IsString()
  @IsOptional()
  signatureText?: string

  @ApiPropertyOptional({ type: String, description: 'Link to signed PDF' })
  @IsString()
  @IsOptional()
  signedDocumentUrl?: string

  @ApiProperty({
    type: String,
    description: 'Regulation type: base or amending',
  })
  @IsString()
  type!: string

  @ApiPropertyOptional({
    type: [RegulationLawChapter],
    description: 'Law chapters',
  })
  @Type(() => RegulationLawChapter)
  @IsArray()
  @IsOptional()
  lawChapters?: RegulationLawChapter[]

  @ApiPropertyOptional({ type: Boolean, description: 'Skip normal publication timeline' })
  @IsBoolean()
  @IsOptional()
  fastTrack?: boolean

  @ApiPropertyOptional({
    type: [String],
    description: 'Author kennitala',
  })
  @IsArray()
  @IsOptional()
  authors?: string[]

  @ApiPropertyOptional({
    type: [RegulationImpact],
    description: 'Flattened list of impacts (amendments and repeals) across all affected regulations',
  })
  @Type(() => RegulationImpact)
  @IsArray()
  @IsOptional()
  impacts?: RegulationImpact[]
}

// --- Mutation body DTOs ---

export class UpdateRegulationDraftBody {
  @ApiProperty({ type: String, description: 'Drafting status' })
  @IsString()
  draftingStatus!: string

  @ApiProperty({ type: String, description: 'Regulation title' })
  @IsString()
  title!: string

  @ApiProperty({ type: String, description: 'Regulation body HTML' })
  @IsString()
  text!: string

  @ApiProperty({ type: String, description: 'Internal drafting notes HTML' })
  @IsString()
  draftingNotes!: string

  @ApiPropertyOptional({ type: String, description: 'Regulation name (e.g., "0123/2020")' })
  @IsString()
  @IsOptional()
  name?: string

  @ApiPropertyOptional({
    type: [RegulationAppendix],
    description: 'Appendixes',
  })
  @Type(() => RegulationAppendix)
  @IsArray()
  @IsOptional()
  appendixes?: RegulationAppendix[]

  @ApiPropertyOptional({ type: String, description: 'General comments' })
  @IsString()
  @IsOptional()
  comments?: string

  @ApiPropertyOptional({ type: String, description: 'Desired publication date' })
  @IsString()
  @IsOptional()
  idealPublishDate?: string

  @ApiPropertyOptional({ type: String, description: 'Responsible ministry name' })
  @IsString()
  @IsOptional()
  ministry?: string

  @ApiPropertyOptional({ type: String, description: 'Date of signature' })
  @IsString()
  @IsOptional()
  signatureDate?: string

  @ApiPropertyOptional({ type: String, description: 'Rendered signature block HTML' })
  @IsString()
  @IsOptional()
  signatureText?: string

  @ApiPropertyOptional({ type: String, description: 'When the regulation takes legal effect' })
  @IsString()
  @IsOptional()
  effectiveDate?: string

  @ApiPropertyOptional({ type: String, description: 'Regulation type: base or amending' })
  @IsString()
  @IsOptional()
  type?: string

  @ApiPropertyOptional({ type: [String], description: 'Author kennitala' })
  @IsArray()
  @IsOptional()
  authors?: string[]

  @ApiPropertyOptional({ type: String, description: 'Link to signed PDF' })
  @IsString()
  @IsOptional()
  signedDocumentUrl?: string

  @ApiPropertyOptional({ type: [String], description: 'Law chapter slugs' })
  @IsArray()
  @IsOptional()
  lawChapters?: string[]

  @ApiPropertyOptional({ type: Boolean, description: 'Skip normal publication timeline' })
  @IsBoolean()
  @IsOptional()
  fastTrack?: boolean
}

export class CreateRegulationChangeBody {
  @ApiProperty({ type: String, description: 'RegName of the target regulation' })
  @IsString()
  regulation!: string

  @ApiProperty({ type: String, description: 'When this change takes effect' })
  @IsString()
  date!: string

  @ApiProperty({ type: String, description: 'Change section title' })
  @IsString()
  title!: string

  @ApiProperty({ type: String, description: 'New/replacement text HTML' })
  @IsString()
  text!: string

  @ApiPropertyOptional({
    type: [RegulationAppendix],
    description: 'Changed appendixes',
  })
  @Type(() => RegulationAppendix)
  @IsArray()
  @IsOptional()
  appendixes?: RegulationAppendix[]

  @ApiPropertyOptional({ type: String, description: 'Comments about this change' })
  @IsString()
  @IsOptional()
  comments?: string

  @ApiPropertyOptional({ type: String, description: 'HTML diff showing changes' })
  @IsString()
  @IsOptional()
  diff?: string
}

export class UpdateRegulationChangeBody {
  @ApiPropertyOptional({ type: String, description: 'When this change takes effect' })
  @IsString()
  @IsOptional()
  date?: string

  @ApiPropertyOptional({ type: String, description: 'Change section title' })
  @IsString()
  @IsOptional()
  title?: string

  @ApiPropertyOptional({ type: String, description: 'New/replacement text HTML' })
  @IsString()
  @IsOptional()
  text?: string

  @ApiPropertyOptional({
    type: [RegulationAppendix],
    description: 'Changed appendixes',
  })
  @Type(() => RegulationAppendix)
  @IsArray()
  @IsOptional()
  appendixes?: RegulationAppendix[]

  @ApiPropertyOptional({ type: String, description: 'Comments about this change' })
  @IsString()
  @IsOptional()
  comments?: string

  @ApiPropertyOptional({ type: String, description: 'HTML diff showing changes' })
  @IsString()
  @IsOptional()
  diff?: string
}

export class CreateRegulationCancelBody {
  @ApiProperty({ type: String, description: 'RegName of the target regulation' })
  @IsString()
  regulation!: string

  @ApiProperty({ type: String, description: 'When this cancellation takes effect' })
  @IsString()
  date!: string
}

export class UpdateRegulationCancelBody {
  @ApiPropertyOptional({ type: String, description: 'When this cancellation takes effect' })
  @IsString()
  @IsOptional()
  date?: string
}
