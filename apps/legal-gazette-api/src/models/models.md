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

This one was a live bug, not just an swc artefact. Entering the graph through
`type.model.ts` - which `estate.util.ts` does - previously passed `undefined` to
`ApiProperty({ type })` and `Type(() => classRef)`, silently producing a wrong
Swagger schema and no class-transformer nesting for that property.
`model-cycle.spec.ts` pins it.
