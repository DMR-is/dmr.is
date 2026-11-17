import { SetMetadata } from '@nestjs/common'

export const COMPANY_READ_TOKEN_SURFACE_METADATA = 'doeCompanyReadTokenSurface'

/**
 * Widens a company route's token check from `COMPANY_TOKEN_SCOPES` (the
 * island.is application system) to `COMPANY_READ_TOKEN_SCOPES` (also island.is
 * My Pages). Read by `CompanyResourceGuard` and by the company side of
 * `ReportResourceGuard`.
 *
 * For handlers that only read the company's own report data, never for one
 * that files, edits, uploads, withdraws or comments, whatever its HTTP verb.
 * Put it on the handler, not the controller, so a new handler is write-only
 * until someone decides otherwise. `swagger-coverage.spec.ts` pins which
 * handlers carry it.
 */
export const CompanyReadTokenSurface = (): MethodDecorator =>
  SetMetadata(COMPANY_READ_TOKEN_SURFACE_METADATA, true)
