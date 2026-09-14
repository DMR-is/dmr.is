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
match `!:` as well as `?:` - 20 of the 28 sites here are `!:`, so a `?:`-only
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
`Cannot access 'XDto' before initialization`. Under `ts-jest` the same order
produced `undefined` silently; under swc it is a hard crash, so the next import
added in the wrong place breaks the suite rather than shipping a wrong schema.
`core/utils/advert-status.util.ts` and six specs import from `status.model.ts`
directly and survive only because something pulls `advert.model.ts` in first.

The fix is the same move: lift `AdvertDto` and its siblings into an
`advert.dto.ts` that nothing in the cycle imports at value level. Deliberately
not done here - it is larger than the transform switch should absorb.

### What actually resolves today - measure, do not infer

**The "does that module import `advert.model.ts` back?" rule does not predict the
outcome.** Reading the metadata directly is the only reliable check:

```
Reflect.getMetadata('swagger/apiModelProperties', AdvertDto.prototype, '<prop>').type
```

Measured on this branch, in the ordinary import order:

| property | eager site | resolves to |
|---|---|---|
| `courtDistrict` | 781 | **`undefined`** |
| `settlement` | 784 | **`undefined`** |
| `signature` | 817 | **`undefined`** |
| `category` | 793 | `CategoryDto` |
| `type` | 796 | `TypeDto` |
| `status` | 799 | `StatusDto` |
| `assignedUser` | 808 | `UserDto` |

So three of the seven are **already shipping `ApiProperty({ type: undefined })`
and `Type(() => undefined)`** - a wrong OpenAPI `$ref` and no class-transformer
nesting - not merely latent. This is **pre-existing**: the same three are
`undefined` on the merge base under `ts-jest`. The transform switch neither
causes nor worsens it.

`status` resolves correctly in the ordinary order but still throws if
`status.model.ts` is imported first, so it is order-fragile rather than safe.

**`courtDistrict` is unexplained.** `court-district.model.ts` imports only
`@dmr.is/legal-gazette-html`, `@dmr.is/shared-models-base`, `../core/constants`
(which has no imports of its own) and a base DTO - no path back to
`advert.model.ts` - yet it resolves to `undefined` in both import orders tested,
so it is not order-dependent either. `assignedUser` uses the same
`@ApiOptionalDto` decorator and resolves fine, so the decorator variant is not
the cause. Do not treat the cycle rule as sufficient until this is understood.

Tracked in #1506 along with the `advert.dto.ts` extraction.

This one was a live bug, not just an swc artefact. Entering the graph through
`type.model.ts` - which `estate.util.ts` does - previously passed `undefined` to
`ApiProperty({ type })` and `Type(() => classRef)`, silently producing a wrong
Swagger schema and no class-transformer nesting for that property.
`model-cycle.spec.ts` pins it.
