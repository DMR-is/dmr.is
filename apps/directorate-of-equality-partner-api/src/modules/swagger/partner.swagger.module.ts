import { Module } from '@nestjs/common'

import { PartnerApiModule } from '../partner/partner.api.module'

/**
 * The public third-party surface — the aggregate backing the `swagger/partner`
 * document, and the runtime registration point for it.
 *
 * Kept as the single place both
 * `AppModule` and `SWAGGER_CONFIG` name, so a controller cannot be routed
 * without appearing in the published document. That is the arrangement
 * `swagger-coverage.spec.ts` enforces in the sibling app, and the partner surface
 * is where it matters most: this document is the contract an external integrator
 * builds against.
 *
 * A new api module has to be a **direct** entry in `imports`. Swagger's
 * `deepScanRoutes` descends exactly one level from a listed module, so an api
 * module imported by another would answer at runtime and still be missing from
 * the document.
 */
@Module({
  imports: [PartnerApiModule],
})
export class PartnerSwaggerModule {}
