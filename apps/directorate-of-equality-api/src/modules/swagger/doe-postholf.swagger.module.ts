import { Module } from '@nestjs/common'

import { PostholfApiModule } from '../postholf/postholf.api.module'

/**
 * The island.is mailbox callback surface — the aggregate backing the
 * `swagger/postholf` document.
 *
 * A third document rather than a home in one of the existing two, for two
 * reasons that both bite:
 *
 *  - `DoeApplicationSwaggerModule` would fail `swagger-coverage.spec.ts`'s
 *    "publishes nothing but applicant operations to island.is" assertion, whose
 *    `APPLICANT_PATH` is `^/api/v1/application(/|$)`.
 *  - `DoeWebSwaggerModule` is what `directorate-of-equality-web` generates its
 *    client from, and this endpoint has no browser consumer.
 *
 * Publishing it at all (rather than recording it in the spec's `UNPUBLISHED` set)
 * is deliberate: Stafrænt Ísland reviews this endpoint against their Skjalaveita
 * interface spec, so a document of its own is the artefact to hand them.
 *
 * A new api module has to be a **direct** entry in `imports` below — swagger's
 * `deepScanRoutes` descends exactly one level from a listed module.
 */
@Module({
  imports: [PostholfApiModule],
})
export class DoePostholfSwaggerModule {}
