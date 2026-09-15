// These DTOs live outside `type-categories.model.ts` on purpose.
//
// `@ApiDto(TypeDto)` reads its argument eagerly, at class-decoration time.
// `type.model.ts` <-> `type-categories.model.ts` is a cycle, so when the graph
// is entered through `type.model.ts` that read fires while `TypeDto` is still
// uninitialised: `undefined` under tsc (a silently wrong Swagger schema),
// a TDZ `ReferenceError` under swc. Keeping the DTOs in a file that nothing in
// the cycle imports at value level removes the read from the cycle entirely.
import { ApiDto, ApiDtoArray } from '@dmr.is/decorators'

import { BaseEntityDto } from '../modules/base-entity/dto/base-entity.dto'
import { CategoryDto } from './category.model'
import { TypeDto } from './type.model'

export class TypeCategoryDto {
  @ApiDto(TypeDto)
  type!: TypeDto

  @ApiDto(CategoryDto)
  category!: CategoryDto
}

export class TypeWithCategoriesDto extends BaseEntityDto {
  @ApiDtoArray(CategoryDto)
  categories!: CategoryDto[]
}
