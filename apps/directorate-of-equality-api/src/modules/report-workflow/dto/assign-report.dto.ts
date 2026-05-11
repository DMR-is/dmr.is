import { IsOptional, IsUUID, ValidateIf } from 'class-validator'

import { ApiPropertyOptional } from '@nestjs/swagger'

export class AssignReportDto {
  @ApiPropertyOptional({
    type: String,
    format: 'uuid',
    nullable: true,
    description:
      'Target reviewer user id. Omit to assign to the caller, pass a UUID to assign to a specific active user, or pass null to unassign (returns the report to the SUBMITTED queue).',
  })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsUUID()
  userId?: string | null
}
