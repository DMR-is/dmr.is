import { ApiDtoArray, ApiUUId } from '@dmr.is/decorators'

import { PartnerEmployeeDto } from './partner-salary-payload.dto'

/**
 * The two fields that replace `parsed` on the partner surface.
 *
 * A filing names the company's scoring model and sends its payroll extract.
 * The criteria tree, the þrep and the job step assignments are not on the wire
 * at all: they are the employer's, they did not change since the last filing,
 * and a payroll system does not hold them. The server expands the two into the
 * `ParsedReportDto` the pipeline takes.
 */
export class PartnerSalaryPayloadFields {
  @ApiUUId({
    description:
      'The scoring model (starfsmat) to score this filing against. It must be complete — `validation.status: VALID` on `GET /partner/scoring-models/{modelId}` — or the submission is refused with the same reasons that route reports.',
  })
  scoringModelId!: string

  @ApiDtoArray(PartnerEmployeeDto, {
    description:
      'One row per employee. Payroll data, plus the job they hold and the employer’s personal-criterion assessment.',
  })
  employees!: PartnerEmployeeDto[]
}
