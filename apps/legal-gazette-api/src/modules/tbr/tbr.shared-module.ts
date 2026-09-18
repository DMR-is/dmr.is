import { TBRModule } from './tbr.module'

/**
 * The single `TBRModule.forRoot(...)` object reference used by the whole graph.
 *
 * Nest 10 deduplicated dynamic modules by hashing their metadata, so four
 * separate `TBRModule.forRoot(...)` calls with identical configs collapsed into
 * one module instance holding one `TBRService`. Nest 11 keys deduplication on
 * object *reference* instead, so each call site would become its own module with
 * its own `TBRService`. Importing this one object from every call site keeps the
 * Nest 10 shape -- measured in `src/app/nest11-module-dedup.spec.ts`.
 *
 * This also settles an inconsistency the four call sites used to carry: three
 * read the env with a non-null assertion and the fourth defaulted to `''`, which
 * meant they hashed differently -- and so did NOT collapse -- on any deployment
 * where the TBR vars were unset. `TBRService` rejects a falsy credential either
 * way, so `?? ''` preserves the behaviour without asserting a lie.
 */
export const TBRSharedModule = TBRModule.forRoot({
  credentials: process.env.LG_TBR_CREDENTIALS ?? '',
  officeId: process.env.LG_TBR_OFFICE_ID ?? '',
  tbrBasePath: process.env.LG_TBR_PATH ?? '',
})
