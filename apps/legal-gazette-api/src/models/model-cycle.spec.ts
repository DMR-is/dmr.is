import { CategoryDto } from './category.model'
// Entering the graph through `type.model.ts` is the direction that used to put
// `TypeDto` in TDZ while `type-categories` was being decorated - see models.md.
import { TypeDto } from './type.model'
import { TypeCategoryDto } from './type-categories.dto'

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
})
