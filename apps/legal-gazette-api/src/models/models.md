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

### Verifying a site - and the `PickType` trap

Reading the metadata is the right check, but **read it on the class that carries
the decorator**, not on a projection of it:

```
Reflect.getMetadata('swagger/apiModelProperties', AdvertDetailedDto.prototype, 'courtDistrict').type
```

Measured on `AdvertDetailedDto`, which is where all seven eager `@Api*Dto` sites
in this file live, **all seven resolve to their real classes** - `courtDistrict`,
`settlement`, `signature`, `category`, `type`, `status` and `assignedUser`. None
of them is currently broken, and the generated client matches.

**The trap.** `AdvertDto` is `PickType(AdvertDetailedDto, [...])`, and the same
read against `AdvertDto.prototype` returns **no metadata at all** for
`courtDistrict`, `settlement` and `signature` - simply because the pick list does
not include them. `Reflect.getMetadata(...) === undefined` (the property is not on
this class) and `Reflect.getMetadata(...).type === undefined` (the property is
there and its type failed to resolve) are completely different findings, and a
probe written as `metadata?.type` collapses them into one. An earlier revision of
this file reported three properties as broken on that basis; they were not.

So when auditing:

- probe the class that declares the property, not a `PickType`/`OmitType` of it;
- distinguish "no metadata" from "type is undefined";
- a property missing from a generated client may simply be unpicked by design.

So the three sites in the table are a **latent crash**, not a live schema defect.
Verified still reproducing:

```
import './status.model'   // before advert.model
ReferenceError: Cannot access 'StatusDto' before initialization
```

Tracked in #1506 along with the `advert.dto.ts` extraction.

This one was a live bug, not just an swc artefact. Entering the graph through
`type.model.ts` - which `estate.util.ts` does - previously passed `undefined` to
`ApiProperty({ type })` and `Type(() => classRef)`, silently producing a wrong
Swagger schema and no class-transformer nesting for that property.
`model-cycle.spec.ts` pins it.
