import { Op, Transaction, UniqueConstraintError } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'
import slugify from 'slugify'

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { AdvertModel } from '../../models/advert.model'
import { CategoryDto, CategoryModel } from '../../models/category.model'
import {
  CategoryTypeChangeLogModel,
  ChangeLogAction,
  ChangeLogEntity,
  ChangeLogSnapshot,
} from '../../models/category-type-change-log.model'
import { TypeDto, TypeModel } from '../../models/type.model'
import { TypeCategoriesModel } from '../../models/type-categories.model'
import {
  CategoryTypeActor,
  CategoryTypeOverviewDto,
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
import { ICategoryTypeAdminService } from './category-type-admin.service.interface'

const SAMPLE_LIMIT = 20

// Per-advert original values captured for exact undo of a move.
type MovedAdvert = { id: string; typeId: string; categoryId: string }

// The type<->category join rows removed alongside a soft-deleted entity, so that
// undoing the delete restores exactly those and not every join row the entity has
// ever had. Stored under `before.connections`.
type ConnectionRef = { typeId: string; categoryId: string }

// Name of the partial unique index added in
// `m-20260722-category-type-change-log.js`.
const REVERTS_AUDIT_ID_UNIQUE_INDEX =
  'category_type_change_log_reverts_audit_id_unique_idx'

/**
 * True when a write failed because another revert of the same entry got there
 * first. Narrowed to that one index so unrelated unique violations still surface.
 */
function isRevertsAuditIdConflict(error: unknown): boolean {
  if (!(error instanceof UniqueConstraintError)) return false
  const constraint = (error.parent as { constraint?: string } | undefined)
    ?.constraint
  return (
    constraint?.toLowerCase() === REVERTS_AUDIT_ID_UNIQUE_INDEX ||
    Object.keys(error.fields ?? {}).some(
      (field) => field.toLowerCase() === 'reverts_audit_id',
    )
  )
}

@Injectable()
export class CategoryTypeAdminService implements ICategoryTypeAdminService {
  constructor(
    @InjectModel(CategoryModel)
    private readonly categoryModel: typeof CategoryModel,
    @InjectModel(TypeModel) private readonly typeModel: typeof TypeModel,
    @InjectModel(TypeCategoriesModel)
    private readonly typeCategoriesModel: typeof TypeCategoriesModel,
    @InjectModel(AdvertModel) private readonly advertModel: typeof AdvertModel,
    @InjectModel(CategoryTypeChangeLogModel)
    private readonly changeLogModel: typeof CategoryTypeChangeLogModel,
    private readonly sequelize: Sequelize,
  ) {}

  async getOverview(): Promise<CategoryTypeOverviewDto> {
    const [categories, types] = await Promise.all([
      this.categoryModel.unscoped().findAll({
        attributes: ['id', 'title', 'slug', 'active'],
        include: [
          {
            model: TypeModel,
            through: { attributes: [] },
            attributes: ['id', 'title', 'slug', 'active'],
          },
        ],
        order: [['title', 'ASC']],
      }),
      this.typeModel.unscoped().findAll({
        attributes: ['id', 'title', 'slug', 'active'],
        order: [['title', 'ASC']],
      }),
    ])

    return {
      categories: categories.map((category) => ({
        id: category.id,
        title: category.title,
        slug: category.slug,
        active: category.active,
        types: (category.types ?? []).map((type) => ({
          id: type.id,
          title: type.title,
          slug: type.slug,
          active: type.active,
        })),
      })),
      types: types.map((type) => ({
        id: type.id,
        title: type.title,
        slug: type.slug,
        active: type.active,
      })),
    }
  }

  private slugify(value: string): string {
    return slugify(value, { lower: true, strict: true })
  }

  /**
   * Slugs are public URL segments, so a caller-supplied one is normalised rather
   * than trusted. Falls back to the title when no slug was supplied.
   */
  private resolveSlug(title: string, slug?: string): string {
    const source = slug?.trim() ? slug : title
    const resolved = this.slugify(source)
    if (!resolved) {
      throw new BadRequestException(
        'Ekki tókst að búa til slóð (slug) út frá gefnu heiti.',
      )
    }
    return resolved
  }

  /**
   * `slug` is `TEXT NOT NULL UNIQUE` and both tables are paranoid, so a
   * soft-deleted row still occupies its slug. Without this check, deleting "Foo"
   * and creating it again raises a raw 23505 and 500s.
   */
  private async assertSlugAvailable(
    entityType: ChangeLogEntity.CATEGORY | ChangeLogEntity.TYPE,
    slug: string,
    transaction: Transaction,
    excludeId?: string,
  ): Promise<void> {
    const options = {
      where: excludeId ? { slug, id: { [Op.ne]: excludeId } } : { slug },
      paranoid: false,
      transaction,
    }
    const existing =
      entityType === ChangeLogEntity.CATEGORY
        ? await this.categoryModel.unscoped().findOne(options)
        : await this.typeModel.unscoped().findOne(options)
    if (!existing) return

    const label = entityType === ChangeLogEntity.CATEGORY ? 'flokkur' : 'tegund'
    const suffix = existing.deletedAt
      ? ' Sá aðili er í eyddum færslum — afturkallaðu eyðinguna eða veldu aðra slóð.'
      : ''
    throw new ConflictException(
      `Slóðin (slug) "${slug}" er þegar í notkun af öðrum ${label}.${suffix}`,
    )
  }

  private async writeChangeLog(
    transaction: Transaction,
    params: {
      actor: CategoryTypeActor
      action: ChangeLogAction
      entityType: ChangeLogEntity
      entityId: string | null
      before: ChangeLogSnapshot | null
      after: ChangeLogSnapshot | null
      affectedAdvertCount?: number
      affectedAdvertIds?: string[] | null
      revertsAuditId?: string | null
    },
  ): Promise<void> {
    await this.changeLogModel.create(
      {
        actorId: params.actor.id,
        actorName: params.actor.name,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        before: params.before,
        after: params.after,
        affectedAdvertCount: params.affectedAdvertCount ?? 0,
        affectedAdvertIds: params.affectedAdvertIds ?? null,
        revertsAuditId: params.revertsAuditId ?? null,
      },
      { transaction },
    )
  }

  private async advertImpact(
    where: Record<string, unknown>,
    transaction?: Transaction,
  ): Promise<ImpactDto> {
    const affectedAdvertCount = await this.advertModel.count({
      where,
      transaction,
    })
    const sample = await this.advertModel.findAll({
      where,
      attributes: ['id'],
      limit: SAMPLE_LIMIT,
      transaction,
    })
    return { affectedAdvertCount, sampleAdvertIds: sample.map((a) => a.id) }
  }

  private categorySnapshot(model: CategoryModel): ChangeLogSnapshot {
    return { title: model.title, slug: model.slug, active: model.active }
  }

  private typeSnapshot(model: TypeModel): ChangeLogSnapshot {
    return { title: model.title, slug: model.slug, active: model.active }
  }

  /** The join rows currently attached to an entity (excluding soft-deleted ones). */
  private async liveConnections(
    where: { typeId: string } | { categoryId: string },
    transaction: Transaction,
  ): Promise<ConnectionRef[]> {
    const rows = await this.typeCategoriesModel.unscoped().findAll({
      where,
      attributes: ['typeId', 'categoryId'],
      transaction,
    })
    return rows.map((row) => ({
      typeId: row.typeId,
      categoryId: row.categoryId,
    }))
  }

  /** Reads `before.connections` back out of a DELETE snapshot, if it has one. */
  private connectionsFromSnapshot(
    snapshot: ChangeLogSnapshot | null,
  ): ConnectionRef[] | null {
    const raw = snapshot?.connections
    if (!Array.isArray(raw)) return null
    return raw.filter(
      (entry): entry is ConnectionRef =>
        typeof entry === 'object' &&
        entry !== null &&
        typeof (entry as ConnectionRef).typeId === 'string' &&
        typeof (entry as ConnectionRef).categoryId === 'string',
    )
  }

  // --- Categories ---------------------------------------------------------

  async createCategory(
    body: CreateCategoryBody,
    actor: CategoryTypeActor,
  ): Promise<CategoryDto> {
    const slug = this.resolveSlug(body.title, body.slug)
    return this.sequelize.transaction(async (transaction) => {
      await this.assertSlugAvailable(
        ChangeLogEntity.CATEGORY,
        slug,
        transaction,
      )
      const created = await this.categoryModel.create(
        { title: body.title, slug },
        { transaction },
      )
      await this.writeChangeLog(transaction, {
        actor,
        action: ChangeLogAction.CREATE,
        entityType: ChangeLogEntity.CATEGORY,
        entityId: created.id,
        before: null,
        after: { title: created.title, slug: created.slug, active: true },
      })
      return created.fromModel()
    })
  }

  async updateCategory(
    id: string,
    body: UpdateCategoryBody,
    actor: CategoryTypeActor,
  ): Promise<CategoryDto> {
    return this.sequelize.transaction(async (transaction) => {
      const category = await this.categoryModel
        .unscoped()
        .findByPk(id, { transaction })
      if (!category) {
        throw new NotFoundException(`Category ${id} not found`)
      }
      const before = this.categorySnapshot(category)
      if (body.title !== undefined) category.title = body.title
      if (body.slug !== undefined) {
        const slug = this.resolveSlug(category.title, body.slug)
        if (slug !== category.slug) {
          await this.assertSlugAvailable(
            ChangeLogEntity.CATEGORY,
            slug,
            transaction,
            category.id,
          )
          category.slug = slug
        }
      }
      await category.save({ transaction })
      await this.writeChangeLog(transaction, {
        actor,
        action: ChangeLogAction.UPDATE,
        entityType: ChangeLogEntity.CATEGORY,
        entityId: category.id,
        before,
        after: this.categorySnapshot(category),
      })
      return category.fromModel()
    })
  }

  async setCategoryActive(
    id: string,
    body: SetActiveBody,
    actor: CategoryTypeActor,
  ): Promise<CategoryDto> {
    return this.sequelize.transaction(async (transaction) => {
      const category = await this.categoryModel
        .unscoped()
        .findByPk(id, { transaction })
      if (!category) {
        throw new NotFoundException(`Category ${id} not found`)
      }
      const before = this.categorySnapshot(category)
      category.active = body.active
      await category.save({ transaction })
      await this.writeChangeLog(transaction, {
        actor,
        action: ChangeLogAction.SET_ACTIVE,
        entityType: ChangeLogEntity.CATEGORY,
        entityId: category.id,
        before,
        after: this.categorySnapshot(category),
      })
      return category.fromModel()
    })
  }

  async getCategoryImpact(id: string): Promise<ImpactDto> {
    return this.advertImpact({ categoryId: id })
  }

  async deleteCategory(id: string, actor: CategoryTypeActor): Promise<void> {
    await this.sequelize.transaction(async (transaction) => {
      const category = await this.categoryModel
        .unscoped()
        .findByPk(id, { transaction })
      if (!category) {
        throw new NotFoundException(`Category ${id} not found`)
      }
      const { affectedAdvertCount } = await this.advertImpact(
        { categoryId: id },
        transaction,
      )
      if (affectedAdvertCount > 0) {
        throw new BadRequestException(
          `Cannot delete category: ${affectedAdvertCount} adverts still reference it. Move them first.`,
        )
      }
      // Capture the live connections before destroying them, so undoing this
      // delete restores exactly these and not connections detached earlier.
      const connections = await this.liveConnections(
        { categoryId: id },
        transaction,
      )
      const before = {
        ...this.categorySnapshot(category),
        connections,
      }
      await this.typeCategoriesModel.destroy({
        where: { categoryId: id },
        transaction,
      })
      await category.destroy({ transaction })
      await this.writeChangeLog(transaction, {
        actor,
        action: ChangeLogAction.DELETE,
        entityType: ChangeLogEntity.CATEGORY,
        entityId: id,
        before,
        after: null,
      })
    })
  }

  // --- Types --------------------------------------------------------------

  async createType(
    body: CreateTypeBody,
    actor: CategoryTypeActor,
  ): Promise<TypeDto> {
    const slug = this.resolveSlug(body.title, body.slug)
    return this.sequelize.transaction(async (transaction) => {
      await this.assertSlugAvailable(ChangeLogEntity.TYPE, slug, transaction)
      const created = await this.typeModel.create(
        { title: body.title, slug },
        { transaction },
      )
      for (const categoryId of body.categoryIds ?? []) {
        await this.createConnection(created.id, categoryId, transaction)
      }
      await this.writeChangeLog(transaction, {
        actor,
        action: ChangeLogAction.CREATE,
        entityType: ChangeLogEntity.TYPE,
        entityId: created.id,
        before: null,
        after: {
          title: created.title,
          slug: created.slug,
          active: true,
          categoryIds: body.categoryIds ?? [],
        },
      })
      return created.fromModel()
    })
  }

  async updateType(
    id: string,
    body: UpdateTypeBody,
    actor: CategoryTypeActor,
  ): Promise<TypeDto> {
    return this.sequelize.transaction(async (transaction) => {
      const type = await this.typeModel.unscoped().findByPk(id, { transaction })
      if (!type) {
        throw new NotFoundException(`Type ${id} not found`)
      }
      const before = this.typeSnapshot(type)
      if (body.title !== undefined) type.title = body.title
      if (body.slug !== undefined) {
        const slug = this.resolveSlug(type.title, body.slug)
        if (slug !== type.slug) {
          await this.assertSlugAvailable(
            ChangeLogEntity.TYPE,
            slug,
            transaction,
            type.id,
          )
          type.slug = slug
        }
      }
      await type.save({ transaction })
      await this.writeChangeLog(transaction, {
        actor,
        action: ChangeLogAction.UPDATE,
        entityType: ChangeLogEntity.TYPE,
        entityId: type.id,
        before,
        after: this.typeSnapshot(type),
      })
      return type.fromModel()
    })
  }

  async setTypeActive(
    id: string,
    body: SetActiveBody,
    actor: CategoryTypeActor,
  ): Promise<TypeDto> {
    return this.sequelize.transaction(async (transaction) => {
      const type = await this.typeModel.unscoped().findByPk(id, { transaction })
      if (!type) {
        throw new NotFoundException(`Type ${id} not found`)
      }
      const before = this.typeSnapshot(type)
      type.active = body.active
      await type.save({ transaction })
      await this.writeChangeLog(transaction, {
        actor,
        action: ChangeLogAction.SET_ACTIVE,
        entityType: ChangeLogEntity.TYPE,
        entityId: type.id,
        before,
        after: this.typeSnapshot(type),
      })
      return type.fromModel()
    })
  }

  async getTypeImpact(id: string): Promise<ImpactDto> {
    return this.advertImpact({ typeId: id })
  }

  async deleteType(id: string, actor: CategoryTypeActor): Promise<void> {
    await this.sequelize.transaction(async (transaction) => {
      const type = await this.typeModel.unscoped().findByPk(id, { transaction })
      if (!type) {
        throw new NotFoundException(`Type ${id} not found`)
      }
      const { affectedAdvertCount } = await this.advertImpact(
        { typeId: id },
        transaction,
      )
      if (affectedAdvertCount > 0) {
        throw new BadRequestException(
          `Cannot delete type: ${affectedAdvertCount} adverts still reference it. Move them first.`,
        )
      }
      // Capture the live connections before destroying them, so undoing this
      // delete restores exactly these and not connections detached earlier.
      const connections = await this.liveConnections(
        { typeId: id },
        transaction,
      )
      const before = {
        ...this.typeSnapshot(type),
        connections,
      }
      await this.typeCategoriesModel.destroy({
        where: { typeId: id },
        transaction,
      })
      await type.destroy({ transaction })
      await this.writeChangeLog(transaction, {
        actor,
        action: ChangeLogAction.DELETE,
        entityType: ChangeLogEntity.TYPE,
        entityId: id,
        before,
        after: null,
      })
    })
  }

  // --- Connections --------------------------------------------------------

  /** Creates or restores a type<->category join row. Returns true if changed. */
  private async createConnection(
    typeId: string,
    categoryId: string,
    transaction: Transaction,
  ): Promise<boolean> {
    const existing = await this.typeCategoriesModel.findOne({
      where: { typeId, categoryId },
      paranoid: false,
      transaction,
    })
    if (existing) {
      if (existing.deletedAt) {
        await existing.restore({ transaction })
        return true
      }
      return false
    }
    await this.typeCategoriesModel.create({ typeId, categoryId } as never, {
      transaction,
    })
    return true
  }

  async attach(body: ConnectionBody, actor: CategoryTypeActor): Promise<void> {
    await this.sequelize.transaction(async (transaction) => {
      const [type, category] = await Promise.all([
        this.typeModel.unscoped().findByPk(body.typeId, { transaction }),
        this.categoryModel
          .unscoped()
          .findByPk(body.categoryId, { transaction }),
      ])
      if (!type) throw new NotFoundException(`Type ${body.typeId} not found`)
      if (!category) {
        throw new NotFoundException(`Category ${body.categoryId} not found`)
      }
      const changed = await this.createConnection(
        body.typeId,
        body.categoryId,
        transaction,
      )
      if (!changed) return
      await this.writeChangeLog(transaction, {
        actor,
        action: ChangeLogAction.ATTACH,
        entityType: ChangeLogEntity.CONNECTION,
        entityId: body.typeId,
        before: null,
        after: { typeId: body.typeId, categoryId: body.categoryId },
      })
    })
  }

  async detach(body: ConnectionBody, actor: CategoryTypeActor): Promise<void> {
    await this.sequelize.transaction(async (transaction) => {
      const existing = await this.typeCategoriesModel.findOne({
        where: { typeId: body.typeId, categoryId: body.categoryId },
        transaction,
      })
      if (!existing) {
        throw new NotFoundException('Connection not found')
      }
      await existing.destroy({ transaction })
      await this.writeChangeLog(transaction, {
        actor,
        action: ChangeLogAction.DETACH,
        entityType: ChangeLogEntity.CONNECTION,
        entityId: body.typeId,
        before: { typeId: body.typeId, categoryId: body.categoryId },
        after: null,
      })
    })
  }

  // --- Bulk advert moves --------------------------------------------------

  private moveWhere(body: MoveAdvertsBody): Record<string, unknown> {
    return {
      typeId: body.fromTypeId,
      ...(body.fromCategoryId ? { categoryId: body.fromCategoryId } : {}),
    }
  }

  private assertMoveTargets(body: MoveAdvertsBody): void {
    if (!body.toTypeId && !body.toCategoryId) {
      throw new BadRequestException(
        'A move must set a target type and/or category',
      )
    }
  }

  async getMoveImpact(body: MoveAdvertsBody): Promise<ImpactDto> {
    this.assertMoveTargets(body)
    return this.advertImpact(this.moveWhere(body))
  }

  async moveAdverts(
    body: MoveAdvertsBody,
    actor: CategoryTypeActor,
  ): Promise<ImpactDto> {
    this.assertMoveTargets(body)
    return this.sequelize.transaction(async (transaction) => {
      const adverts = await this.advertModel.findAll({
        where: this.moveWhere(body),
        attributes: ['id', 'typeId', 'categoryId'],
        transaction,
      })
      const moved: MovedAdvert[] = adverts.map((a) => ({
        id: a.id,
        typeId: a.typeId as string,
        categoryId: a.categoryId,
      }))
      const ids = moved.map((m) => m.id)

      if (ids.length > 0) {
        const values: { typeId?: string; categoryId?: string } = {}
        if (body.toTypeId) values.typeId = body.toTypeId
        if (body.toCategoryId) values.categoryId = body.toCategoryId
        await this.advertModel.update(values, {
          where: { id: { [Op.in]: ids } },
          transaction,
        })
      }

      await this.writeChangeLog(transaction, {
        actor,
        action: ChangeLogAction.MOVE,
        entityType: ChangeLogEntity.TYPE,
        entityId: body.fromTypeId,
        before: {
          filter: {
            fromTypeId: body.fromTypeId,
            fromCategoryId: body.fromCategoryId ?? null,
          },
          adverts: moved,
        },
        after: {
          toTypeId: body.toTypeId ?? null,
          toCategoryId: body.toCategoryId ?? null,
        },
        affectedAdvertCount: ids.length,
        affectedAdvertIds: ids,
      })

      return {
        affectedAdvertCount: ids.length,
        sampleAdvertIds: ids.slice(0, SAMPLE_LIMIT),
      }
    })
  }

  // --- Audit + undo -------------------------------------------------------

  async getChangeLog(query: ChangeLogQuery): Promise<GetChangeLogDto> {
    const where: Record<string, unknown> = {}
    if (query.entityType) where.entityType = query.entityType
    if (query.entityId) where.entityId = query.entityId

    const { rows, count } = await this.changeLogModel.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: query.limit ?? 50,
      offset: query.offset ?? 0,
    })

    return {
      entries: rows.map((r) => r.fromModel()),
      total: count,
    }
  }

  async revert(auditId: string, actor: CategoryTypeActor): Promise<void> {
    try {
      await this.revertInTransaction(auditId, actor)
    } catch (error) {
      // The `alreadyReverted` read below is not serialisable under READ
      // COMMITTED, so two concurrent reverts of the same entry both pass it. The
      // partial unique index on `reverts_audit_id` stops the second one here —
      // translate it into the same friendly error the fast path produces.
      if (isRevertsAuditIdConflict(error)) {
        throw new BadRequestException('This change has already been reverted')
      }
      throw error
    }
  }

  private async revertInTransaction(
    auditId: string,
    actor: CategoryTypeActor,
  ): Promise<void> {
    await this.sequelize.transaction(async (transaction) => {
      const audit = await this.changeLogModel.findByPk(auditId, { transaction })
      if (!audit) {
        throw new NotFoundException(`Audit entry ${auditId} not found`)
      }
      if (audit.action === ChangeLogAction.REVERT) {
        throw new BadRequestException('Cannot revert a revert')
      }
      const alreadyReverted = await this.changeLogModel.findOne({
        where: { revertsAuditId: auditId },
        transaction,
      })
      if (alreadyReverted) {
        throw new BadRequestException('This change has already been reverted')
      }

      let affectedAdvertCount = 0
      let affectedAdvertIds: string[] | null = null

      switch (audit.action) {
        case ChangeLogAction.CREATE:
          await this.revertCreate(audit, transaction)
          break
        case ChangeLogAction.DELETE:
          await this.revertDelete(audit, transaction)
          break
        case ChangeLogAction.UPDATE:
        case ChangeLogAction.SET_ACTIVE:
          await this.restoreSnapshot(audit, transaction)
          break
        case ChangeLogAction.ATTACH:
          await this.detachRaw(audit, transaction)
          break
        case ChangeLogAction.DETACH:
          await this.attachRaw(audit, transaction)
          break
        case ChangeLogAction.MOVE: {
          affectedAdvertCount = await this.revertMove(audit, transaction)
          affectedAdvertIds = audit.affectedAdvertIds ?? null
          break
        }
        default:
          throw new BadRequestException(`Cannot revert action ${audit.action}`)
      }

      await this.writeChangeLog(transaction, {
        actor,
        action: ChangeLogAction.REVERT,
        entityType: audit.entityType,
        entityId: audit.entityId,
        before: audit.after,
        after: audit.before,
        affectedAdvertCount,
        affectedAdvertIds,
        revertsAuditId: audit.id,
      })
    })
  }

  private async revertCreate(
    audit: CategoryTypeChangeLogModel,
    transaction: Transaction,
  ): Promise<void> {
    if (!audit.entityId) return
    const isCategory = audit.entityType === ChangeLogEntity.CATEGORY
    const where = isCategory
      ? { categoryId: audit.entityId }
      : { typeId: audit.entityId }
    const { affectedAdvertCount } = await this.advertImpact(where, transaction)
    if (affectedAdvertCount > 0) {
      throw new BadRequestException(
        `Cannot undo creation: ${affectedAdvertCount} adverts now reference it.`,
      )
    }
    await this.typeCategoriesModel.destroy({ where, transaction })
    if (isCategory) {
      await this.categoryModel
        .unscoped()
        .destroy({ where: { id: audit.entityId }, transaction })
    } else {
      await this.typeModel
        .unscoped()
        .destroy({ where: { id: audit.entityId }, transaction })
    }
  }

  private async revertDelete(
    audit: CategoryTypeChangeLogModel,
    transaction: Transaction,
  ): Promise<void> {
    if (!audit.entityId) return
    const isCategory = audit.entityType === ChangeLogEntity.CATEGORY
    if (isCategory) {
      await this.categoryModel
        .unscoped()
        .restore({ where: { id: audit.entityId }, transaction })
    } else {
      await this.typeModel
        .unscoped()
        .restore({ where: { id: audit.entityId }, transaction })
    }
    // Restore only the join rows this delete actually removed. Restoring by
    // entity id would also resurrect connections the admin detached deliberately
    // in an earlier, separate DETACH action.
    const connections = this.connectionsFromSnapshot(audit.before)
    if (connections === null) {
      // Log rows written before `before.connections` existed carry no record of
      // which connections went with the delete. Restoring nothing is the safe
      // choice: an admin can re-attach from the UI, whereas a wrongly resurrected
      // connection silently widens what citizens can select in the public form.
      return
    }
    for (const connection of connections) {
      await this.typeCategoriesModel.restore({
        where: { typeId: connection.typeId, categoryId: connection.categoryId },
        transaction,
      })
    }
  }

  private applySnapshot(
    entity: CategoryModel | TypeModel,
    before: ChangeLogSnapshot,
  ): void {
    if (typeof before.title === 'string') entity.title = before.title
    if (typeof before.slug === 'string') entity.slug = before.slug
    if (typeof before.active === 'boolean') entity.active = before.active
  }

  private async restoreSnapshot(
    audit: CategoryTypeChangeLogModel,
    transaction: Transaction,
  ): Promise<void> {
    if (!audit.entityId || !audit.before) return
    if (audit.entityType === ChangeLogEntity.CATEGORY) {
      const entity = await this.categoryModel
        .unscoped()
        .findByPk(audit.entityId, { transaction })
      if (!entity) {
        throw new NotFoundException(`Category ${audit.entityId} not found`)
      }
      this.applySnapshot(entity, audit.before)
      await entity.save({ transaction })
    } else {
      const entity = await this.typeModel
        .unscoped()
        .findByPk(audit.entityId, { transaction })
      if (!entity) {
        throw new NotFoundException(`Type ${audit.entityId} not found`)
      }
      this.applySnapshot(entity, audit.before)
      await entity.save({ transaction })
    }
  }

  private connectionFromSnapshot(
    snapshot: ChangeLogSnapshot | null,
  ): { typeId: string; categoryId: string } {
    const typeId = snapshot?.typeId
    const categoryId = snapshot?.categoryId
    if (typeof typeId !== 'string' || typeof categoryId !== 'string') {
      throw new BadRequestException('Malformed connection audit entry')
    }
    return { typeId, categoryId }
  }

  private async attachRaw(
    audit: CategoryTypeChangeLogModel,
    transaction: Transaction,
  ): Promise<void> {
    const { typeId, categoryId } = this.connectionFromSnapshot(audit.before)
    await this.createConnection(typeId, categoryId, transaction)
  }

  private async detachRaw(
    audit: CategoryTypeChangeLogModel,
    transaction: Transaction,
  ): Promise<void> {
    const { typeId, categoryId } = this.connectionFromSnapshot(audit.after)
    const existing = await this.typeCategoriesModel.findOne({
      where: { typeId, categoryId },
      transaction,
    })
    if (existing) await existing.destroy({ transaction })
  }

  private async revertMove(
    audit: CategoryTypeChangeLogModel,
    transaction: Transaction,
  ): Promise<number> {
    const before = audit.before
    const adverts = (before?.adverts as MovedAdvert[] | undefined) ?? []
    if (adverts.length === 0) return 0

    // Group by original (typeId, categoryId) to minimise UPDATE statements.
    const groups = new Map<string, string[]>()
    for (const advert of adverts) {
      const key = `${advert.typeId}|${advert.categoryId}`
      const bucket = groups.get(key) ?? []
      bucket.push(advert.id)
      groups.set(key, bucket)
    }
    for (const [key, ids] of groups) {
      const [typeId, categoryId] = key.split('|')
      await this.advertModel.update(
        { typeId, categoryId },
        { where: { id: { [Op.in]: ids } }, transaction },
      )
    }
    return adverts.length
  }
}
