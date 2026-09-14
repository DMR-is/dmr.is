# Why association properties use a type-only alias

Every association property in these models annotates its type through a
type-only alias rather than naming the class directly:

```ts
import { CaseModel } from './case.model'
import type { CaseModel as CaseModelRef } from './case.model'

@BelongsTo(() => CaseModel, { foreignKey: 'caseId', as: 'case' })
case?: CaseModelRef
```

## The defect

The model graph is inherently cyclic — `case.model.ts` imports
`CaseStatusModel` for its `@BelongsTo`, and `case-status.model.ts` reaches back
through `case-comment.model.ts` to `CaseModel`. The `() => Model` arrows are
lazy and fine. What is not fine is `emitDecoratorMetadata`, which emits an
**eager** read of the annotated type at class-decoration time, while the other
module is still mid-evaluation.

`tsc` assigns `exports.X` only after the class body runs, so that read yields
`undefined` and nothing complains. `swc` emits ESM-faithful live bindings — an
export getter installed before any `require()`, over a TDZ binding — so the
same read **throws** `Cannot access 'CaseModel' before initialization`. Under
real ESM tsc's would too. The cycle plus an eval-time read is the defect; swc
only makes it audible.

The alias resolves to a type-only binding, so neither compiler emits a runtime
read: tsc emits `design:type = Function`, swc emits `Object`.

## What is safe without the alias

`X | null`, `X[]`, and same-file self-references already emit `Object` or
`Array` — only a plain, cross-module class annotation reads. Members of a
`type X = { … }` alias are erased entirely and emit nothing.

When auditing, match `!:` as well as `?:`. A `?:`-only search misses
`sourceReport!: ReportModelRef` shapes and reports the tree clean when it is
not. The emitted metadata is the authority, not the source regex.

## Why this is verified rather than argued

The equivalent note in `libs/directorate-of-equality/modules/src/models.ts`
says nothing reads `design:type`, because every `@Column` there declares
`type: DataType.*` explicitly. **That argument does not hold here.** 36 of the
236 `@Column` decorators in this library pass no explicit `type:` and so do
rely on inferred `design:type`, and the two compilers do not emit it
identically:

| annotated as | tsc | swc |
|---|---|---|
| `Date` | `Date` | `typeof Date === "undefined" ? Object : Date` |
| aliased model | `Function` | `Object` |
| string enum | `String` | the enum object itself |

So it was checked instead. The library was emitted under both compilers (213
files each, 366 `design:type` sites each) and the Sequelize registry booted
from both: **identical tables, attributes and associations across 45 models,
292 attributes and 92 associations**. The same comparison against `origin/main`
under tsc is also identical, so the alias change is inert in the production
build.

Production compiles with `@nx/webpack:webpack` and `compiler: tsc`. swc is used
by Jest only.

## Load order

There is no central model registry here — models reach Sequelize through the
per-domain `models/index.ts` barrels and `SequelizeModule.forFeature`. Requiring
model files directly, in an order no barrel produces, can still enter a cycle
from a direction that throws under swc (and silently yields `undefined` under
tsc). The library barrel is the supported entry point; load through it.

## Nest modules have the same problem

The eager-read-inside-a-cycle defect is not limited to models. A module class
named bare in another module's `imports:` array is an eager read too:

- `pdf.module.ts` wraps `UtilityModule` in `forwardRef` because
  `utility → application → case → pdf` reaches back.
- `issues.module.ts` used to re-export its own submodule
  (`export { IssuesTaskModule } from './task/issues.task.module'`). swc hoists
  re-exports to the top of the file where tsc emits them in source position, so
  that line evaluated the submodule while `IssuesModule` was still in TDZ. The
  re-export now lives in `issues/index.ts` and the cycle is gone.

Related: import a service **token** from its own `*.service.interface.ts`, never
through the `*.module.ts` that re-exports it. Importing `IUtilityService` from
`utility.module` drags the entire module graph into a file that only wanted a
`Symbol`, and is how `pdf.service.spec.ts` came to enter the cycle at all.
