import { CategoryDto } from '../../models/category.model'
import { TypeDto } from '../../models/type.model'
import {
  CategoryTypeActor,
  ChangeLogQuery,
  ConnectionBody,
  CreateCategoryBody,
  CreateTypeBody,
  GetChangeLogDto,
  ImpactDto,
  MoveAdvertsBody,
  SetActiveBody,
  UpdateCategoryBody,
  UpdateTypeBody,
} from './dto/category-type-admin.dto'

export interface ICategoryTypeAdminService {
  // Categories
  createCategory(body: CreateCategoryBody, actor: CategoryTypeActor): Promise<CategoryDto>
  updateCategory(
    id: string,
    body: UpdateCategoryBody,
    actor: CategoryTypeActor,
  ): Promise<CategoryDto>
  deleteCategory(id: string, actor: CategoryTypeActor): Promise<void>
  setCategoryActive(
    id: string,
    body: SetActiveBody,
    actor: CategoryTypeActor,
  ): Promise<CategoryDto>
  getCategoryImpact(id: string): Promise<ImpactDto>

  // Types
  createType(body: CreateTypeBody, actor: CategoryTypeActor): Promise<TypeDto>
  updateType(
    id: string,
    body: UpdateTypeBody,
    actor: CategoryTypeActor,
  ): Promise<TypeDto>
  deleteType(id: string, actor: CategoryTypeActor): Promise<void>
  setTypeActive(
    id: string,
    body: SetActiveBody,
    actor: CategoryTypeActor,
  ): Promise<TypeDto>
  getTypeImpact(id: string): Promise<ImpactDto>

  // Connections (type <-> category)
  attach(body: ConnectionBody, actor: CategoryTypeActor): Promise<void>
  detach(body: ConnectionBody, actor: CategoryTypeActor): Promise<void>

  // Bulk advert re-pointing
  getMoveImpact(body: MoveAdvertsBody): Promise<ImpactDto>
  moveAdverts(body: MoveAdvertsBody, actor: CategoryTypeActor): Promise<ImpactDto>

  // Audit + undo
  getChangeLog(query: ChangeLogQuery): Promise<GetChangeLogDto>
  revert(auditId: string, actor: CategoryTypeActor): Promise<void>
}

export const ICategoryTypeAdminService = Symbol('ICategoryTypeAdminService')
