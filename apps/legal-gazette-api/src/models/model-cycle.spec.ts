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

  // `TypeWithCategoriesDto` moved out of the cycle for the same reason, but it
  // carries `@ApiDtoArray`, which stores `() => classRef` rather than the class.
  // The thunk defers the read, so this site was never the eager defect - pinned
  // so that swapping it to an eager `@ApiDto` cannot pass unnoticed.
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
