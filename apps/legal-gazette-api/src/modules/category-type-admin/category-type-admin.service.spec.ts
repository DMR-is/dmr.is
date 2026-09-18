import { Op, UniqueConstraintError } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'

import { BadRequestException, ConflictException } from '@nestjs/common'
import { getModelToken } from '@nestjs/sequelize'
import { Test, TestingModule } from '@nestjs/testing'

import { AdvertModel } from '../../models/advert.model'
import { CategoryModel } from '../../models/category.model'
import {
  CategoryTypeChangeLogModel,
  ChangeLogAction,
  ChangeLogEntity,
} from '../../models/category-type-change-log.model'
import { TypeModel } from '../../models/type.model'
import { TypeCategoriesModel } from '../../models/type-categories.model'
import { CategoryTypeActor } from './dto/category-type-admin.dto'
import { CategoryTypeAdminService } from './category-type-admin.service'

const ACTOR: CategoryTypeActor = { id: 'admin-1', name: 'Admin' }
const TRANSACTION = { id: 'tx' }

// `unscoped()` returns the same mock, so a test can stub `findByPk` once and have
// it answer both `model.findByPk` and `model.unscoped().findByPk`.
const createEntityModelMock = () => {
  const mock: any = {
    findByPk: jest.fn(),
    findOne: jest.fn().mockResolvedValue(null),
    findAll: jest.fn().mockResolvedValue([]),
    create: jest.fn(),
    destroy: jest.fn().mockResolvedValue(1),
    restore: jest.fn().mockResolvedValue(undefined),
    update: jest.fn().mockResolvedValue([0]),
  }
  mock.unscoped = jest.fn().mockReturnValue(mock)
  return mock
}

// A minimal stand-in for a loaded CategoryModel/TypeModel row.
const createEntityRow = (overrides: Record<string, unknown> = {}) => {
  const row: any = {
    id: 'entity-1',
    title: 'Titill',
    slug: 'titill',
    active: true,
    deletedAt: null,
    save: jest.fn().mockResolvedValue(undefined),
    destroy: jest.fn().mockResolvedValue(undefined),
    restore: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  }
  row.fromModel = jest.fn().mockReturnValue({
    id: row.id,
    title: row.title,
    slug: row.slug,
  })
  return row
}

const createAudit = (overrides: Record<string, unknown> = {}) => ({
  id: 'audit-1',
  action: ChangeLogAction.UPDATE,
  entityType: ChangeLogEntity.CATEGORY,
  entityId: 'entity-1',
  before: null,
  after: null,
  affectedAdvertCount: 0,
  affectedAdvertIds: null,
  revertsAuditId: null,
  ...overrides,
})

describe('CategoryTypeAdminService', () => {
  let service: CategoryTypeAdminService
  let categoryModel: any
  let typeModel: any
  let typeCategoriesModel: any
  let advertModel: any
  let changeLogModel: any

  beforeEach(async () => {
    categoryModel = createEntityModelMock()
    typeModel = createEntityModelMock()
    typeCategoriesModel = createEntityModelMock()

    advertModel = {
      count: jest.fn().mockResolvedValue(0),
      findAll: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue([0]),
    }

    changeLogModel = {
      create: jest.fn().mockResolvedValue({ id: 'log-1' }),
      findByPk: jest.fn(),
      findOne: jest.fn().mockResolvedValue(null),
      findAndCountAll: jest.fn().mockResolvedValue({ rows: [], count: 0 }),
    }

    const sequelize = {
      transaction: jest.fn((cb: any) => cb(TRANSACTION)),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryTypeAdminService,
        { provide: getModelToken(CategoryModel), useValue: categoryModel },
        { provide: getModelToken(TypeModel), useValue: typeModel },
        {
          provide: getModelToken(TypeCategoriesModel),
          useValue: typeCategoriesModel,
        },
        { provide: getModelToken(AdvertModel), useValue: advertModel },
        {
          provide: getModelToken(CategoryTypeChangeLogModel),
          useValue: changeLogModel,
        },
        { provide: Sequelize, useValue: sequelize },
      ],
    }).compile()

    service = module.get(CategoryTypeAdminService)
  })

  // --- Slug handling ------------------------------------------------------

  describe('slug handling', () => {
    it('normalises a caller-supplied slug through slugify on create', async () => {
      categoryModel.create.mockResolvedValue(createEntityRow())

      await service.createCategory(
        { title: 'Nýr flokkur', slug: 'Some UNSAFE Slug!! /../' },
        ACTOR,
      )

      expect(categoryModel.create).toHaveBeenCalledWith(
        { title: 'Nýr flokkur', slug: 'some-unsafe-slug' },
        { transaction: TRANSACTION },
      )
    })

    it('derives the slug from the title when none is supplied', async () => {
      typeModel.create.mockResolvedValue(createEntityRow())

      await service.createType({ title: 'Almennar auglýsingar' }, ACTOR)

      expect(typeModel.create).toHaveBeenCalledWith(
        { title: 'Almennar auglýsingar', slug: 'almennar-auglysingar' },
        { transaction: TRANSACTION },
      )
    })

    it('rejects creating a category whose slug is taken by a live row', async () => {
      categoryModel.findOne.mockResolvedValue(createEntityRow({ id: 'other' }))

      await expect(
        service.createCategory({ title: 'Titill' }, ACTOR),
      ).rejects.toBeInstanceOf(ConflictException)
      expect(categoryModel.create).not.toHaveBeenCalled()
    })

    it('rejects re-creating a soft-deleted slug and says so (paranoid: false)', async () => {
      categoryModel.findOne.mockResolvedValue(
        createEntityRow({ id: 'other', deletedAt: new Date() }),
      )

      await expect(
        service.createCategory({ title: 'Titill' }, ACTOR),
      ).rejects.toThrow(/eyddum/)

      expect(categoryModel.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ paranoid: false, where: { slug: 'titill' } }),
      )
    })

    it('rejects a type slug already taken', async () => {
      typeModel.findOne.mockResolvedValue(createEntityRow({ id: 'other' }))

      await expect(
        service.createType({ title: 'Titill' }, ACTOR),
      ).rejects.toBeInstanceOf(ConflictException)
      expect(typeModel.create).not.toHaveBeenCalled()
    })

    it('pre-checks (excluding self) when an update changes the slug', async () => {
      const category = createEntityRow({ slug: 'gamalt' })
      categoryModel.findByPk.mockResolvedValue(category)

      await service.updateCategory('entity-1', { slug: 'Nýtt Slug' }, ACTOR)

      expect(categoryModel.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          paranoid: false,
          where: { slug: 'nytt-slug', id: { [Op.ne]: 'entity-1' } },
        }),
      )
      expect(category.slug).toBe('nytt-slug')
    })

    it('skips the pre-check when an update leaves the slug unchanged', async () => {
      const type = createEntityRow({ slug: 'titill' })
      typeModel.findByPk.mockResolvedValue(type)

      await service.updateType('entity-1', { slug: 'titill' }, ACTOR)

      expect(typeModel.findOne).not.toHaveBeenCalled()
      expect(type.save).toHaveBeenCalled()
    })
  })

  // --- Delete guards ------------------------------------------------------

  describe('delete guards', () => {
    it('refuses to delete a category still referenced by adverts', async () => {
      categoryModel.findByPk.mockResolvedValue(createEntityRow())
      advertModel.count.mockResolvedValue(3)

      await expect(service.deleteCategory('entity-1', ACTOR)).rejects.toThrow(
        /3 adverts still reference it/,
      )
      expect(typeCategoriesModel.destroy).not.toHaveBeenCalled()
    })

    it('refuses to delete a type still referenced by adverts', async () => {
      typeModel.findByPk.mockResolvedValue(createEntityRow())
      advertModel.count.mockResolvedValue(1)

      await expect(service.deleteType('entity-1', ACTOR)).rejects.toThrow(
        /1 adverts still reference it/,
      )
      expect(typeCategoriesModel.destroy).not.toHaveBeenCalled()
    })

    it('snapshots the connections it removes into the change log', async () => {
      typeModel.findByPk.mockResolvedValue(createEntityRow({ id: 'type-1' }))
      typeCategoriesModel.findAll.mockResolvedValue([
        { typeId: 'type-1', categoryId: 'cat-a' },
        { typeId: 'type-1', categoryId: 'cat-b' },
      ])

      await service.deleteType('type-1', ACTOR)

      expect(changeLogModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: ChangeLogAction.DELETE,
          before: expect.objectContaining({
            connections: [
              { typeId: 'type-1', categoryId: 'cat-a' },
              { typeId: 'type-1', categoryId: 'cat-b' },
            ],
          }),
        }),
        { transaction: TRANSACTION },
      )
    })
  })

  // --- revert() guards ----------------------------------------------------

  describe('revert guards', () => {
    it('refuses to revert a revert', async () => {
      changeLogModel.findByPk.mockResolvedValue(
        createAudit({ action: ChangeLogAction.REVERT }),
      )

      await expect(service.revert('audit-1', ACTOR)).rejects.toThrow(
        'Cannot revert a revert',
      )
    })

    it('refuses when a revert entry already points at the audit id', async () => {
      changeLogModel.findByPk.mockResolvedValue(createAudit())
      changeLogModel.findOne.mockResolvedValue({ id: 'log-9' })

      await expect(service.revert('audit-1', ACTOR)).rejects.toThrow(
        'This change has already been reverted',
      )
    })

    it('turns the reverts_audit_id unique violation into the same message', async () => {
      changeLogModel.findByPk.mockResolvedValue(
        createAudit({ before: { title: 'Áður', slug: 'adur', active: true } }),
      )
      categoryModel.findByPk.mockResolvedValue(createEntityRow())
      changeLogModel.create.mockRejectedValue(
        new UniqueConstraintError({
          fields: { reverts_audit_id: 'audit-1' },
        }),
      )

      await expect(service.revert('audit-1', ACTOR)).rejects.toThrow(
        'This change has already been reverted',
      )
    })

    it('lets unrelated unique violations through', async () => {
      changeLogModel.findByPk.mockResolvedValue(
        createAudit({ before: { title: 'Áður', slug: 'adur', active: true } }),
      )
      categoryModel.findByPk.mockResolvedValue(createEntityRow())
      const unrelated = new UniqueConstraintError({ fields: { slug: 'adur' } })
      changeLogModel.create.mockRejectedValue(unrelated)

      await expect(service.revert('audit-1', ACTOR)).rejects.toBe(unrelated)
    })

    it('rejects an action it does not know how to undo', async () => {
      changeLogModel.findByPk.mockResolvedValue(
        createAudit({ action: 'ARCHIVE' as ChangeLogAction }),
      )

      await expect(service.revert('audit-1', ACTOR)).rejects.toThrow(
        'Cannot revert action ARCHIVE',
      )
      expect(changeLogModel.create).not.toHaveBeenCalled()
    })
  })

  // --- revert() branches --------------------------------------------------

  describe('revert branches', () => {
    it('CREATE: soft-deletes the entity and its join rows', async () => {
      changeLogModel.findByPk.mockResolvedValue(
        createAudit({
          action: ChangeLogAction.CREATE,
          entityType: ChangeLogEntity.TYPE,
          entityId: 'type-1',
        }),
      )

      await service.revert('audit-1', ACTOR)

      expect(typeCategoriesModel.destroy).toHaveBeenCalledWith({
        where: { typeId: 'type-1' },
        transaction: TRANSACTION,
      })
      expect(typeModel.destroy).toHaveBeenCalledWith({
        where: { id: 'type-1' },
        transaction: TRANSACTION,
      })
      expect(changeLogModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: ChangeLogAction.REVERT,
          revertsAuditId: 'audit-1',
        }),
        { transaction: TRANSACTION },
      )
    })

    it('CREATE: refuses when adverts have since started using the entity', async () => {
      changeLogModel.findByPk.mockResolvedValue(
        createAudit({ action: ChangeLogAction.CREATE }),
      )
      advertModel.count.mockResolvedValue(2)

      await expect(service.revert('audit-1', ACTOR)).rejects.toThrow(
        /Cannot undo creation: 2 adverts/,
      )
      expect(categoryModel.destroy).not.toHaveBeenCalled()
    })

    it('DELETE: restores the entity and only the snapshotted connections', async () => {
      changeLogModel.findByPk.mockResolvedValue(
        createAudit({
          action: ChangeLogAction.DELETE,
          entityType: ChangeLogEntity.TYPE,
          entityId: 'type-1',
          before: {
            title: 'Titill',
            slug: 'titill',
            active: true,
            connections: [
              { typeId: 'type-1', categoryId: 'cat-a' },
              { typeId: 'type-1', categoryId: 'cat-b' },
            ],
          },
        }),
      )

      await service.revert('audit-1', ACTOR)

      expect(typeModel.restore).toHaveBeenCalledWith({
        where: { id: 'type-1' },
        transaction: TRANSACTION,
      })
      expect(typeCategoriesModel.restore).toHaveBeenCalledTimes(2)
      expect(typeCategoriesModel.restore).toHaveBeenNthCalledWith(1, {
        where: { typeId: 'type-1', categoryId: 'cat-a' },
        transaction: TRANSACTION,
      })
      expect(typeCategoriesModel.restore).toHaveBeenNthCalledWith(2, {
        where: { typeId: 'type-1', categoryId: 'cat-b' },
        transaction: TRANSACTION,
      })
    })

    it('DELETE: never restores a connection detached before the delete', async () => {
      // cat-c was detached in an earlier, separate action, so it is absent from
      // the snapshot and must stay detached.
      changeLogModel.findByPk.mockResolvedValue(
        createAudit({
          action: ChangeLogAction.DELETE,
          entityType: ChangeLogEntity.TYPE,
          entityId: 'type-1',
          before: { connections: [{ typeId: 'type-1', categoryId: 'cat-a' }] },
        }),
      )

      await service.revert('audit-1', ACTOR)

      expect(typeCategoriesModel.restore).toHaveBeenCalledTimes(1)
      expect(typeCategoriesModel.restore).toHaveBeenCalledWith({
        where: { typeId: 'type-1', categoryId: 'cat-a' },
        transaction: TRANSACTION,
      })
    })

    it('DELETE: restores no connections for a legacy log row without a snapshot', async () => {
      changeLogModel.findByPk.mockResolvedValue(
        createAudit({
          action: ChangeLogAction.DELETE,
          entityType: ChangeLogEntity.CATEGORY,
          entityId: 'cat-1',
          before: { title: 'Titill', slug: 'titill', active: true },
        }),
      )

      await service.revert('audit-1', ACTOR)

      expect(categoryModel.restore).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
        transaction: TRANSACTION,
      })
      expect(typeCategoriesModel.restore).not.toHaveBeenCalled()
    })

    it('UPDATE: writes the before snapshot back onto the entity', async () => {
      const category = createEntityRow({ title: 'Nýtt', slug: 'nytt' })
      categoryModel.findByPk.mockResolvedValue(category)
      changeLogModel.findByPk.mockResolvedValue(
        createAudit({
          action: ChangeLogAction.UPDATE,
          before: { title: 'Gamalt', slug: 'gamalt', active: true },
        }),
      )

      await service.revert('audit-1', ACTOR)

      expect(category.title).toBe('Gamalt')
      expect(category.slug).toBe('gamalt')
      expect(category.save).toHaveBeenCalledWith({ transaction: TRANSACTION })
    })

    it('SET_ACTIVE: restores the previous active flag', async () => {
      const type = createEntityRow({ active: false })
      typeModel.findByPk.mockResolvedValue(type)
      changeLogModel.findByPk.mockResolvedValue(
        createAudit({
          action: ChangeLogAction.SET_ACTIVE,
          entityType: ChangeLogEntity.TYPE,
          before: { title: 'Titill', slug: 'titill', active: true },
        }),
      )

      await service.revert('audit-1', ACTOR)

      expect(type.active).toBe(true)
      expect(type.save).toHaveBeenCalledWith({ transaction: TRANSACTION })
    })

    it('ATTACH: detaches the connection that was attached', async () => {
      const connection = { destroy: jest.fn().mockResolvedValue(undefined) }
      typeCategoriesModel.findOne.mockResolvedValue(connection)
      changeLogModel.findByPk.mockResolvedValue(
        createAudit({
          action: ChangeLogAction.ATTACH,
          entityType: ChangeLogEntity.CONNECTION,
          after: { typeId: 'type-1', categoryId: 'cat-1' },
        }),
      )

      await service.revert('audit-1', ACTOR)

      expect(typeCategoriesModel.findOne).toHaveBeenCalledWith({
        where: { typeId: 'type-1', categoryId: 'cat-1' },
        transaction: TRANSACTION,
      })
      expect(connection.destroy).toHaveBeenCalledWith({
        transaction: TRANSACTION,
      })
    })

    it('DETACH: restores the soft-deleted join row rather than inserting a new one', async () => {
      const connection = {
        deletedAt: new Date(),
        restore: jest.fn().mockResolvedValue(undefined),
      }
      typeCategoriesModel.findOne.mockResolvedValue(connection)
      changeLogModel.findByPk.mockResolvedValue(
        createAudit({
          action: ChangeLogAction.DETACH,
          entityType: ChangeLogEntity.CONNECTION,
          before: { typeId: 'type-1', categoryId: 'cat-1' },
        }),
      )

      await service.revert('audit-1', ACTOR)

      expect(connection.restore).toHaveBeenCalledWith({
        transaction: TRANSACTION,
      })
      expect(typeCategoriesModel.create).not.toHaveBeenCalled()
    })

    it('DETACH: rejects a malformed connection snapshot', async () => {
      changeLogModel.findByPk.mockResolvedValue(
        createAudit({
          action: ChangeLogAction.DETACH,
          entityType: ChangeLogEntity.CONNECTION,
          before: { typeId: 'type-1' },
        }),
      )

      await expect(service.revert('audit-1', ACTOR)).rejects.toBeInstanceOf(
        BadRequestException,
      )
    })

    it('MOVE: restores each advert to its own original type/category', async () => {
      changeLogModel.findByPk.mockResolvedValue(
        createAudit({
          action: ChangeLogAction.MOVE,
          entityType: ChangeLogEntity.TYPE,
          entityId: 'type-new',
          affectedAdvertIds: ['a1', 'a2', 'a3'],
          before: {
            adverts: [
              { id: 'a1', typeId: 'type-a', categoryId: 'cat-a' },
              { id: 'a2', typeId: 'type-b', categoryId: 'cat-b' },
              { id: 'a3', typeId: 'type-a', categoryId: 'cat-a' },
            ],
          },
        }),
      )

      await service.revert('audit-1', ACTOR)

      // Two distinct originals -> two UPDATEs, not three.
      expect(advertModel.update).toHaveBeenCalledTimes(2)
      expect(advertModel.update).toHaveBeenCalledWith(
        { typeId: 'type-a', categoryId: 'cat-a' },
        { where: { id: { [Op.in]: ['a1', 'a3'] } }, transaction: TRANSACTION },
      )
      expect(advertModel.update).toHaveBeenCalledWith(
        { typeId: 'type-b', categoryId: 'cat-b' },
        { where: { id: { [Op.in]: ['a2'] } }, transaction: TRANSACTION },
      )
      expect(changeLogModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: ChangeLogAction.REVERT,
          affectedAdvertCount: 3,
          affectedAdvertIds: ['a1', 'a2', 'a3'],
        }),
        { transaction: TRANSACTION },
      )
    })

    it('MOVE: is a no-op when the snapshot holds no adverts', async () => {
      changeLogModel.findByPk.mockResolvedValue(
        createAudit({
          action: ChangeLogAction.MOVE,
          entityType: ChangeLogEntity.TYPE,
          before: { adverts: [] },
        }),
      )

      await service.revert('audit-1', ACTOR)

      expect(advertModel.update).not.toHaveBeenCalled()
      expect(
        changeLogModel.create,
      ).toHaveBeenCalledWith(
        expect.objectContaining({ affectedAdvertCount: 0 }),
        { transaction: TRANSACTION },
      )
    })
  })
})
