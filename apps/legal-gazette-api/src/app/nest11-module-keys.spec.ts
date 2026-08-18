import { Sequelize } from 'sequelize-typescript'

import { Module } from '@nestjs/common'
import { MODULE_METADATA } from '@nestjs/common/constants'
import { ModuleCompiler } from '@nestjs/core/injector/compiler'
import { SequelizeModule } from '@nestjs/sequelize'
import { Test } from '@nestjs/testing'

import { AdvertGuardsModule } from '../core/guards/advert-guards/advert-guards.module'
import { AppModule } from './app.module'

/**
 * Nest 11 replaces the module-identity algorithm. Nest 10 derives a module's
 * token from a deep hash of its metadata (`DeepHashedModuleOpaqueKeyFactory`);
 * Nest 11 defaults to `ByReferenceModuleOpaqueKeyFactory`, which stamps a
 * generated id onto the *original* `DynamicModule` object under a private
 * symbol and reuses it on every later lookup of that same object. Deep hashing
 * is still available on 11, but only if you opt in with
 * `moduleIdGeneratorAlgorithm: 'deep-hash'`.
 *
 * `src/app/nest11-module-dedup.spec.ts` characterizes what that change does to
 * *deduplication* -- how many module and provider instances the graph ends up
 * with. This file covers the other half: whether the graph still *compiles* at
 * all once identity is reference-based, which is a boot-or-not question rather
 * than a how-many question.
 *
 * `simulateByReferenceModuleKeys` reimplements Nest 11's factory on top of
 * Nest 10's `ModuleCompiler`. The important detail is which object gets
 * stamped. Nest 11 hands the factory `moduleClsOrDynamic` -- the object as it
 * appears in the `imports` array -- and NOT the `dynamicMetadata` object that
 * `extractMetadata` produces, because that one is rebuilt by an object spread
 * on every single call. Keying on the rebuilt object instead is what makes a
 * simulation report a boot failure that the real Nest 11 does not have: the
 * second `compile` of the same import (`NestContainer.addImport` compiles it
 * again to look up its token) returns a fresh token, the module is silently
 * dropped from `_imports`, and any `exports` entry that pointed at it then
 * fails `validateExportedProvider`.
 */
const K_MODULE_ID = Symbol('K_MODULE_ID')

type Stamped = { [K_MODULE_ID]?: string }

const simulateByReferenceModuleKeys = (): (() => void) => {
  const original = ModuleCompiler.prototype.compile
  let counter = 0

  ModuleCompiler.prototype.compile = async function (metatype) {
    const resolved = await metatype
    const { type, dynamicMetadata } = this.extractMetadata(resolved)
    const originalRef = resolved as unknown as Stamped

    let token = originalRef[K_MODULE_ID]
    if (!token) {
      token = `${type?.name ?? 'anonymous'}_${++counter}`
      originalRef[K_MODULE_ID] = token
    }

    return { type, dynamicMetadata, token }
  }

  return () => {
    ModuleCompiler.prototype.compile = original
  }
}

const metadataArray = (
  target: unknown,
  key: 'imports' | 'exports',
): Array<unknown> => {
  const value: unknown = Reflect.getMetadata(
    key === 'imports' ? MODULE_METADATA.IMPORTS : MODULE_METADATA.EXPORTS,
    target as object,
  )
  return Array.isArray(value) ? value : []
}

/** `true` for the object `SequelizeModule.forFeature([...])` returns. */
const isSequelizeFeature = (item: unknown): boolean =>
  typeof item === 'object' &&
  item !== null &&
  (item as { module?: unknown }).module === SequelizeModule

describe('Nest 11 reference-based module identity', () => {
  describe('AdvertGuardsModule', () => {
    /**
     * SPECIFIED. `AdvertGuardsModule` imports `SequelizeModule.forFeature([...])`
     * inline and re-exports it so consumers -- publication.controller.module and
     * advert-publish.controller.module -- can inject the two models the guards
     * use. Exporting the same object the module imports is the form that holds
     * under both identity algorithms; exporting the bare `SequelizeModule` class
     * instead only works because `Module.validateExportedProvider` compares
     * against the *metatype* of each import rather than its token, which is an
     * implementation detail of the container rather than a documented contract.
     */
    it('re-exports the same dynamic module object it imports', () => {
      const imported = metadataArray(AdvertGuardsModule, 'imports').filter(
        isSequelizeFeature,
      )
      const exported = metadataArray(AdvertGuardsModule, 'exports')

      expect(imported).toHaveLength(1)
      expect(exported).toContain(imported[0])
      expect(exported).not.toContain(SequelizeModule)
    })
  })

  describe('the real legal-gazette-api container', () => {
    /**
     * SPECIFIED. Reference-based identity splits every dynamic module that Nest
     * 10 collapsed, which changes which module owns which provider and
     * therefore what each importer can see. The graph must still compile.
     */
    it('compiles AppModule when module identity is reference-based', async () => {
      const restore = simulateByReferenceModuleKeys()
      try {
        const testingModule = await Test.createTestingModule({
          imports: [AppModule],
        })
          .overrideProvider(Sequelize)
          .useValue({ repositoryMode: false, close: () => Promise.resolve() })
          .compile()

        await testingModule.close()
      } finally {
        restore()
      }
    }, 120000)
  })

  describe('re-exporting a dynamic module', () => {
    /**
     * CHARACTERIZED against @nestjs/core 11.1.29 and @nestjs/sequelize 11.0.1
     * in a throwaway project outside this repo: both shapes boot there, and the
     * providers injected through the re-export resolve in both.
     *
     * Recording it here as well means the claim is checkable from inside the
     * repo. If the Nest 11 bump ever does make the bare-class form throw
     * `UnknownExportException`, this is the test that says so -- and the fix is
     * the shape asserted above, not a revert.
     */
    it('accepts both the bare class and the imported instance', async () => {
      const restore = simulateByReferenceModuleKeys()
      try {
        const feature = SequelizeModule.forFeature([])

        @Module({ imports: [feature], exports: [SequelizeModule] })
        class ExportsBareClass {}

        @Module({ imports: [feature], exports: [feature] })
        class ExportsImportedInstance {}

        @Module({ imports: [ExportsBareClass, ExportsImportedInstance] })
        class RootModule {}

        const testingModule = await Test.createTestingModule({
          imports: [RootModule],
        })
          .overrideProvider(Sequelize)
          .useValue({ repositoryMode: false, close: () => Promise.resolve() })
          .compile()

        await testingModule.close()
      } finally {
        restore()
      }
    }, 60000)
  })
})
