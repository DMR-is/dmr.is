# official-journal-web

Admin web for the Official Journal (Stjórnartíðindi), used by OJOI staff to review, edit and publish
cases. Next.js App Router on top of `official-journal-api`; see `.claude/apps/official-journal/CLAUDE.md`
for setup, codegen and conventions.

## Regulations feature flag

> Temporary. Remove this section when the feature flag is removed.

Regulations submitted through OJOI ("the new flow", replacing the regulations-admin portal) are
behind a feature flag in island.is, not in this repo:

|      |                                                                                                      |
| ---- | ---------------------------------------------------------------------------------------------------- |
| Flag | `Features.officialJournalOfIcelandRegulations` (`isOjoiRegulationApplicationPathEnabled`, ConfigCat) |
| Dev  | on                                                                                                   |
| Prod | off                                                                                                  |

With the flag off, the OJOI application on island.is only offers the advert type, so no case with
`applicationType` `base_regulation` or `amending_regulation` is ever created. Everything for regulations
in this repo hangs off that `applicationType`, so it stays dormant without a flag of its own:

- **Case view** — `isRegulation` in `src/context/caseContext.tsx` gates the regulation sections in
  `CaseFields.tsx`: `AdditionalPartiesField`, `RegulationMetadataFields` (including the warning when the
  effective date is on or before the requested publication date) and `RegulationImpactsFields`.
- **Publishing** — `case.service.ts` in `libs/official-journal/modules` publishes to regulations-api via
  `publishRegulationByType` only for those application types; other adverts keep the existing path.

So merging regulation work here is safe while the flag is off in prod: it shows on dev, where the flag is
on, and goes live in prod when the flag is turned on there.
