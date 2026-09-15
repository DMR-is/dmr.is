import { readdirSync } from 'fs'

import { CategoryDto } from './category.model'
// Entering the graph through `type.model.ts` is the direction that used to put
// `TypeDto` in TDZ while `type-categories` was being decorated - see models.md.
import { TypeDto } from './type.model'
import { TypeCategoryDto, TypeWithCategoriesDto } from './type-categories.dto'

import 'reflect-metadata'

describe('type <-> type-categories model cycle', () => {
  it.each([
    ['type', TypeDto],
    ['category', CategoryDto],
  ])('records the real class on %s, not undefined', (property, expected) => {
    const meta = Reflect.getMetadata(
      'swagger/apiModelProperties',
      TypeCategoryDto.prototype,
      property,
    )

    expect(meta.type).toBe(expected)
  })

  // `TypeWithCategoriesDto` moved out of the cycle for the same reason. It
  // carries `@ApiDtoArray`, which stores `() => classRef` rather than the class -
  // but that thunk is NOT what keeps this site safe. A decorator is a function
  // call, so `@ApiDtoArray(CategoryDto)` reads `CategoryDto` at the call site
  // exactly like `@ApiDto` would; the stored thunk only defers dereferencing an
  // already-bound parameter. This site is safe because `type-categories.dto.ts`
  // sits outside the cycle - the same reason `foreclosure.dto.ts` had to be
  // extracted once its `@ApiDtoArray` site was found inside one. See models.md.
  it('resolves the real class through the array thunk on categories', () => {
    const meta = Reflect.getMetadata(
      'swagger/apiModelProperties',
      TypeWithCategoriesDto.prototype,
      'categories',
    )

    expect(meta.isArray).toBe(true)
    expect(typeof meta.type).toBe('function')
    expect(meta.type()).toBe(CategoryDto)
  })
})

// Every `@Api*Dto` argument is read eagerly - a decorator call evaluates its
// argument like any other function call, `*Array` variants included. The only
// thing that keeps those reads safe is that no DTO class carrying one is
// reachable from inside the model cycle at value level. That property is
// invisible in the import graph of any single file and it depends on the order
// modules happen to be required in, so pin it by brute force: enter the graph
// through each model/DTO file in turn and check every decorated class property
// still resolves to the class it names.
//
// Order has to be driven with `require` inside the test body. A top-of-file
// `import './status.model'` would not express it - the import sorter reorders
// those alphabetically and would silently disarm the test.
const ENTRY_POINTS = readdirSync(__dirname)
  .filter((file) => file.endsWith('.model.ts') || file.endsWith('.dto.ts'))
  .map((file) => file.replace(/\.ts$/, ''))
  .sort()

/**
 * Every class property whose `@Api*` decorator names another class eagerly,
 * as [declaring module, class, property, module the argument comes from,
 * export name]. Each one is a read that fires at class-decoration time.
 */
const EAGER_SITES: Array<[string, string, string, string, string]> = [
  [
    './advert.dto',
    'AdvertDetailedDto',
    'courtDistrict',
    './court-district.model',
    'CourtDistrictDto',
  ],
  [
    './advert.dto',
    'AdvertDetailedDto',
    'settlement',
    './settlement.model',
    'SettlementDto',
  ],
  [
    './advert.dto',
    'AdvertDetailedDto',
    'communicationChannels',
    './communication-channel.model',
    'CommunicationChannelDto',
  ],
  [
    './advert.dto',
    'AdvertDetailedDto',
    'publications',
    './advert-publication.model',
    'AdvertPublicationDto',
  ],
  [
    './advert.dto',
    'AdvertDetailedDto',
    'category',
    './category.model',
    'CategoryDto',
  ],
  ['./advert.dto', 'AdvertDetailedDto', 'type', './type.model', 'TypeDto'],
  [
    './advert.dto',
    'AdvertDetailedDto',
    'status',
    './status.model',
    'StatusDto',
  ],
  [
    './advert.dto',
    'AdvertDetailedDto',
    'assignedUser',
    './users.model',
    'UserDto',
  ],
  [
    './advert.dto',
    'AdvertDetailedDto',
    'comments',
    './comment.dto',
    'CommentDto',
  ],
  [
    './advert.dto',
    'AdvertDetailedDto',
    'signature',
    './signature.model',
    'SignatureDto',
  ],
  // The edge that forced `application.dto.ts` out of `application.model.ts`.
  [
    './application.dto',
    'ApplicationDto',
    'adverts',
    './advert.dto',
    'AdvertDto',
  ],
  // Found by this matrix: a bare `@ApiProperty({ type: StatusDto })`, which is
  // just as eager as `@ApiDto` and which a grep for `@Api*Dto(` does not match.
  ['./comment.dto', 'CommentDto', 'status', './status.model', 'StatusDto'],
  // Found by this matrix: an `@ApiDtoArray` inside a cycle - proof that the
  // array variants defer nothing, since the argument is evaluated at the call.
  [
    './foreclosure.dto',
    'ForeclosureDto',
    'properties',
    './foreclosure-property.model',
    'ForeclosurePropertyDto',
  ],
  [
    './advert-publication.model',
    'PublishedPublicationDto',
    'type',
    './type.model',
    'TypeDto',
  ],
  [
    './advert-publication.model',
    'PublishedPublicationDto',
    'category',
    './category.model',
    'CategoryDto',
  ],
  // `type-categories.dto.ts` - the file the original #1505 defect lived in. The
  // hand-written block at the top of this file pins these too, but only for one
  // import order; these rows put them through every entry point.
  [
    './type-categories.dto',
    'TypeCategoryDto',
    'type',
    './type.model',
    'TypeDto',
  ],
  [
    './type-categories.dto',
    'TypeCategoryDto',
    'category',
    './category.model',
    'CategoryDto',
  ],
  [
    './type-categories.dto',
    'TypeWithCategoriesDto',
    'categories',
    './category.model',
    'CategoryDto',
  ],
]

/**
 * `@ApiDtoArray` stores `() => classRef`; the eager variants store the class.
 * Branch on "is this a non-class function", not on `isArray` - a plain
 * `@ApiProperty({ type: X, isArray: true })` stores the class itself, and
 * calling it would throw "Class constructor cannot be invoked without 'new'"
 * instead of failing with a readable assertion.
 */
const resolveType = (meta: { type: unknown }) =>
  typeof meta.type === 'function' &&
  !(meta.type as { prototype?: unknown }).prototype
    ? (meta.type as () => unknown)()
    : meta.type

/* eslint-disable @typescript-eslint/no-var-requires */
describe('model cycle, entered from every direction', () => {
  it.each(ENTRY_POINTS)(
    'resolves every eager decorator argument when the graph is entered via %s',
    (entry) => {
      jest.resetModules()

      require(`./${entry}`)

      for (const [
        module,
        className,
        property,
        argModule,
        argName,
      ] of EAGER_SITES) {
        const meta = Reflect.getMetadata(
          'swagger/apiModelProperties',
          require(module)[className].prototype,
          property,
        )

        // `undefined` here means the property is not declared on this class -
        // a different finding from a declared property whose type failed to
        // resolve. Always probe the declaring class, never a `PickType` /
        // `OmitType` projection of it. See models.md.
        expect(meta).toBeDefined()
        expect(resolveType(meta)).toBe(require(argModule)[argName])
      }

      // The table above is hand-maintained, and a hand-maintained list is
      // precisely what let `comment.model.ts` and `foreclosure.model.ts` go
      // unnoticed. So sweep the whole directory too - registration is not
      // required for a new eager site to be covered.
      //
      // Under `@swc/jest` the signal is almost always the require above
      // throwing, not this assertion: a read of a half-initialised binding is
      // a TDZ error, so `type` rarely survives as `undefined`. The sweep still
      // earns its place by *touching* every class - it forces each module to
      // load and each stored thunk to be called - and the `undefined` check is
      // what would catch the tsc-side failure mode, which is silent.
      for (const module of ENTRY_POINTS) {
        for (const [className, declared] of Object.entries<any>(
          require(`./${module}`),
        )) {
          if (typeof declared !== 'function' || !declared.prototype) continue

          const properties: Array<string> =
            Reflect.getMetadata(
              'swagger/apiModelPropertiesArray',
              declared.prototype,
            ) ?? []

          for (const raw of properties) {
            const property = raw.replace(/^:/, '')
            const meta = Reflect.getMetadata(
              'swagger/apiModelProperties',
              declared.prototype,
              property,
            )
            if (!meta) continue

            // A thunk that throws surfaces here as the TDZ error it is.
            expect({
              site: `${module}: ${className}.${property}`,
              type: resolveType(meta),
            }).not.toMatchObject({ type: undefined })
          }
        }
      }
    },
  )
})
