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
is the argument. The rule covers **any class or enum argument** - `@ApiEnum` is
the same read, and the `advert-html.ts` case below was an enum, not a DTO. DTO
classes whose decorators name another module's class or enum therefore live in a
`*.dto.ts` that nothing in the cycle imports at value level:
`type-categories.dto.ts`, `advert.dto.ts`, `application.dto.ts`,
`comment.dto.ts`, `foreclosure.dto.ts`.

**Every decorator argument is eager - the `*Array` variants included.** This is
the part that is easy to get wrong. `ApiDto` and `ApiOptionalDto` store
`type: classRef`; `ApiDtoArray` and `ApiOptionalDtoArray` store
`type: () => classRef`. That inner thunk defers nothing that matters: a decorator
is a function call, so `@ApiDtoArray(CommentDto)` evaluates `CommentDto` at
decoration time exactly like `@ApiDto(CommentDto)` does, and the thunk only
defers dereferencing a parameter that is already bound. What _is_ lazy is a
**call-site** thunk - `@BelongsTo(() => CaseModel)`, `@Scopes(() => ({ ... }))`,
`@ForeignKey(() => ApplicationModel)` - where the identifier sits inside the
arrow and is not read until sequelize resolves it. Do not treat an `*Array` site
as safe; `foreclosure.model.ts` was broken by exactly that assumption.

**A bare `@ApiProperty({ type: X })` is the same defect**, and a grep for
`@Api*Dto(` does not match it. `comment.model.ts` carried one. Grep
`type: [A-Z]\w*Dto\b` (excluding `() =>`) as well as `@Api(Optional)?Dto\(`, or
the count will be an undercount - as every count in #1506 was.

`@ApiEnum(SomeEnum)` is eager for the same reason. `advert.dto.ts` and
`application.dto.ts` each carry one today; both are safe only because neither
file is in a cycle with the module the enum comes from.

**Module-level constants count too.** `core/html/advert-html.ts` computed
`const DEFAULT_VERSION = AdvertVersionEnum.A` at module scope, where the enum
comes from `advert-publication.model.ts`, which imports `advert.model.ts` back,
which imports that file. It now resolves per call. Any eval-time read of a value
from a module you are in a cycle with is the same bug, decorator or not.

### Verifying a site - and the `PickType` trap

Reading the metadata is the right check, but **read it on the class that carries
the decorator**, not on a projection of it:

```
Reflect.getMetadata('swagger/apiModelProperties', AdvertDetailedDto.prototype, 'courtDistrict').type
```

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

### The regression guard

Reading one site by hand does not prove much: a cycle only misfires for _some_
entry orders, and the order a spec happens to use is usually the safe one. So
`model-cycle.spec.ts` brute-forces it - for each `*.model.ts` / `*.dto.ts` in
this directory it resets the module registry, requires that file **first**, and
then asserts every eager decorator argument still resolves to the class it names.
Add a row to its `EAGER_SITES` table whenever you add an eager argument.

That matrix is what found the `comment.model.ts`, `foreclosure.model.ts` and
`advert-html.ts` cases; a hand-written pin for the three sites we already knew
about would have missed all three. Drive the order with `require` inside the test
body, never with a top-of-file `import` - the import sorter reorders those
alphabetically and silently disarms the test.

### Scope: the rest of the repo is clean

Swept 2026-09-15. Outside this directory there are 49 eager `@Api*Dto` arguments -
48 in `libs/directorate-of-equality/modules`, 1 in `official-journal-api` - and
**none of them sits in a value-level import cycle**: 27 name a class declared in
the same file, 22 cross files that do not import back. DoE keeps its DTOs in
`*.dto.ts` files separate from the model layer already, which is why.

One latent case is worth knowing about:
`libs/directorate-of-equality/modules/src/report/dto/report-list-item.dto.ts` _is_
inside a cycle with `report/models/report.model.ts` (it imports enums from it at
value level), but its only eager argument, `UserDto`, comes from outside that
cycle. Safe today; unsafe the moment an eager `@Api*Dto` there names an in-cycle
class.

This was a live bug, not just an swc artefact. Entering the graph through
`type.model.ts` - which `estate.util.ts` does - previously passed `undefined` to
`ApiProperty({ type })` and `Type(() => classRef)`, silently producing a wrong
Swagger schema and no class-transformer nesting for that property.
`model-cycle.spec.ts` pins it.
