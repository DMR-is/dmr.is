/**
 * Public surface of `@dmr.is/clients-withholding-tax`, a client for
 * Skatturinn's WithholdingTaxApi (staðgreiðsla). Consumers import
 * `WithholdingTaxModule` and inject `IWithholdingTaxService`; the concrete
 * service is not exported.
 */

export { WithholdingTaxModule } from './lib/withholding-tax.module'
export {
  IWithholdingTaxService,
  type WithholdingTaxJobCountResult,
} from './lib/withholding-tax.service.interface'
export {
  JOB_COUNT_BANDS,
  type JobCountBand,
  type WithholdingTaxJobCount,
} from './lib/withholding-tax.schemas'
export {
  isWithholdingTaxError,
  WithholdingTaxError,
  type WithholdingTaxErrorReason,
  type WithholdingTaxOperation,
} from './lib/withholding-tax.errors'
