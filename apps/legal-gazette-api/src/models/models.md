# Model import cycles

The model graph here is cyclic - `type.model.ts` and `category.model.ts` both
reach `type-categories.model.ts`, which reaches back to both. The `() => Model`
arrows sequelize-typescript takes are lazy and fine. Two other things are not,
and both are **eager reads that fire while the other module is still
mid-evaluation**.

`tsc` assigns `exports.X` only after the class body runs, so such a read yields
`undefined` and nothing complains. `swc` emits ESM-faithful live bindings, so
the same read throws `Cannot access 'X' before initialization`. Under real ESM
tsc would too. The cycle plus an eval-time read is the defect; swc only makes it
audible. Jest runs on `@swc/jest`; production still compiles with tsc.

## 1. Association annotations - use a type-only alias

`emitDecoratorMetadata` emits an eager read of the annotated type for every
decorated property, to produce `design:type`:

```ts
import type { CaseModel as CaseModelRef } from './case.model'
import { CaseModel } from './case.model'

@BelongsTo(() => CaseModel, { foreignKey: 'caseId', as: 'case' })
case!: CaseModelRef
```

The alias is a type-only binding, so neither compiler emits a runtime read:
tsc emits `design:type = Function`, swc emits `Object`.

Safe without the alias: `X | null`, `X[]`, same-file self-references, and
members of a `type X = { … }` alias, which are erased entirely. When auditing,
match `!:` as well as `?:` - 22 of the 28 sites here are `!:`, so a `?:`-only
search reports the tree clean when it is not.

## 2. Decorator _arguments_ - keep them out of the cycle

`@ApiDto(TypeDto)` reads `TypeDto` eagerly too, and no alias can help: the class
is the argument. `TypeCategoryDto` and `TypeWithCategoriesDto` therefore live in
`type-categories.dto.ts`, which nothing in the cycle imports at value level,
rather than in `type-categories.model.ts`.

**Which decorators are affected.** `ApiDto` and `ApiOptionalDto` pass
`type: classRef` - eager, and therefore unsafe inside a cycle. `ApiDtoArray` and
`ApiOptionalDtoArray` pass `type: () => classRef`; the thunk defers the read, so
they are immune. That distinction, not the property name, decides which sites
need the treatment.

**`type-categories` was not the only site.** Three eager arguments remain in
`advert.model.ts`, each paired with a leaf model that imports `advert.model.ts`
back at value level:

| site | argument | cycle partner |
|---|---|---|
| `advert.model.ts:784` | `@ApiOptionalDto(SettlementDto)` | `settlement.model.ts` |
| `advert.model.ts:799` | `@ApiDto(StatusDto)` | `status.model.ts` |
| `advert.model.ts:817` | `@ApiOptionalDto(SignatureDto)` | `signature.model.ts` |

Importing the leaf model *before* `advert.model.ts` throws
`Cannot access 'XDto' before initialization`. Nothing enters that way today, so
the suite passes - but `core/utils/advert-status.util.ts` and six specs import
from `status.model.ts` directly and survive only because something pulls
`advert.model.ts` in first. Under `ts-jest` the same order produced `undefined`
silently; under swc it is a hard crash, so the next import added in the wrong
place breaks the suite rather than shipping a wrong schema.

The fix is the same move: lift `AdvertDto` and its siblings into an
`advert.dto.ts` that nothing in the cycle imports at value level. Deliberately
not done here - it is larger than the transform switch should absorb.

The other four eager sites in that class are safe: `CourtDistrictDto` (781),
`CategoryDto` (793), `TypeDto` (796) and `UserDto` (808) - none of those modules
imports `advert.model.ts` back, so there is no cycle to be early in.

This one was a live bug, not just an swc artefact. Entering the graph through
`type.model.ts` - which `estate.util.ts` does - previously passed `undefined` to
`ApiProperty({ type })` and `Type(() => classRef)`, silently producing a wrong
Swagger schema and no class-transformer nesting for that property.
`model-cycle.spec.ts` pins it.
