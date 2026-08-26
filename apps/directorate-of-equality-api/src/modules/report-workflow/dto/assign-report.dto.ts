import { IsOptional, IsUUID, ValidateIf } from 'class-validator'

import { ApiPropertyOptional } from '@nestjs/swagger'

import { ApiOptionalBoolean } from '@dmr.is/decorators'

export class AssignReportDto {
  @ApiPropertyOptional({
    type: String,
    format: 'uuid',
    nullable: true,
    description:
      'Target reviewer user id. Omit to assign to the caller, pass a UUID to assign to a specific active user, or pass null to unassign.',
  })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsUUID()
  userId?: string | null

  @ApiOptionalBoolean({
    default: true,
    description:
      'Whether the assignment also moves the report through the review pipeline: `SUBMITTED` → `IN_REVIEW` when a reviewer is set, and `IN_REVIEW` → `SUBMITTED` when one is cleared. Defaults to true, which is the "take this report" action. Pass false to change only the reviewer and leave the status alone — assigning work ahead of it actually being picked up.',
  })
  updateStatus?: boolean
}
