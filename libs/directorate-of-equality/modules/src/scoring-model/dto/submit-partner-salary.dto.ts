import { ArrayMaxSize } from 'class-validator'

import { ApiDtoArray, ApiUUId } from '@dmr.is/decorators'

import { MAX_EMPLOYEES } from '../../report-excel/workbook.schema'
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
      'The scoring model (starfsmat) to score this filing against. Check it reads `validation.status: VALID` on `GET /partner/scoring-models/{modelId}` first: an incomplete model is refused here too, though the submission reports it through the payload gate’s own vocabulary rather than the model’s `reasons` list. A model this key’s company does not own is a 404.',
  })
  scoringModelId!: string

  // `assertWithinCapacity` enforces the same ceiling, but only after the model
  // has been loaded and the whole payload expanded — so a deliberately O(1)
  // guard was running last. Declaring it here refuses an oversized extract
  // before any of that work happens.
  @ArrayMaxSize(MAX_EMPLOYEES)
  @ApiDtoArray(PartnerEmployeeDto, {
    description:
      'One row per employee. Payroll data, plus the job they hold and the employer’s personal-criterion assessment.',
  })
  employees!: PartnerEmployeeDto[]
}
