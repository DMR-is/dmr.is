import type { Cache } from 'cache-manager'
import { Sequelize } from 'sequelize-typescript'

import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Inject, Injectable, Module } from '@nestjs/common'
import { ModulesContainer } from '@nestjs/core'
import { Test } from '@nestjs/testing'

import { createRedisCacheOptions } from '@dmr.is/utils-server/cacheUtils'

import { ITBRConfig } from '../modules/tbr/tbr.config'
import { TBRModule } from '../modules/tbr/tbr.module'
import { ITBRService } from '../modules/tbr/tbr.service.interface'
import { AppModule } from './app.module'

/**
 * Nest 10 deduplicates dynamic modules by hashing their metadata: two separate
 * `Something.forRoot(...)` calls that serialize identically collapse into ONE
 * module instance. Nest 11 keys deduplication on object *reference* instead, so
 * every call site becomes its own module instance -- with its own copy of every
 * provider that module declares.
 *
 * Nothing about that change is visible to `tsc`, to `yarn install` or to a boot
 * smoke test. It shows up only as duplicated singletons at runtime: a second
 * Redis client, a second connection pool, a second in-memory cache that the
 * first writer never invalidates.
 *
 * These tests record what Nest 10 does today. Every expectation is labelled
 * CHARACTERIZED (measured against Nest 10 -- expected to change on the bump,
 * and a reviewer may update it once the new value is understood) or SPECIFIED
 * (a decision we are making now -- it must keep holding after the bump).
 *
 * `createRedisCacheOptions` picks its CacheModule shape from the Redis env at
 * module load time; `src/test-redis-env.ts` pins those vars through the jest
 * `setupFiles` hook so these assertions measure the production
 * `registerAsync` shape on every machine and in CI.
 */

const countModules = (container: ModulesContainer, name: string): number => {
  let count = 0
  for (const module of container.values()) {
    if (module.metatype?.name === name) count++
  }
  return count
}

const countProviders = (container: ModulesContainer, name: string): number => {
  let count = 0
  for (const module of container.values()) {
    for (const wrapper of module.providers.values()) {
      const token =
        typeof wrapper.token === 'function'
          ? wrapper.token.name
          : String(wrapper.token)
      if (token === name) count++
    }
  }
  return count
}

/** Signature of a SequelizeModule instance: the provider tokens it declares. */
const sequelizeSignatures = (container: ModulesContainer): string[] => {
  const signatures: string[] = []
  for (const module of container.values()) {
    if (module.metatype?.name !== 'SequelizeModule') continue
    const tokens: string[] = []
    for (const wrapper of module.providers.values()) {
      const token =
        typeof wrapper.token === 'function'
          ? wrapper.token.name
          : String(wrapper.token)
      if (token !== 'SequelizeModule') tokens.push(token)
    }
    signatures.push(tokens.sort().join(' + '))
  }
  return signatures.sort()
}

describe('Nest 11 dynamic-module deduplication', () => {
  describe('CacheModule built by createRedisCacheOptions', () => {
    /**
     * legal-gazette-api calls `createRedisCacheOptions('lg-advert-publications')`
     * from three modules: publishing.task.module, publication.provider.module
     * and advert-publish.provider.module. Each call returns a brand-new
     * `CacheModule.registerAsync` object whose `useFactory` constructs a fresh
     * KeyvRedis client.
     */
    it('collapses three call sites into one cache manager', async () => {
      @Injectable()
      class PublishingConsumer {
        constructor(@Inject(CACHE_MANAGER) readonly cache: Cache) {}
      }

      @Injectable()
      class PublicationConsumer {
        constructor(@Inject(CACHE_MANAGER) readonly cache: Cache) {}
      }

      @Injectable()
      class AdvertPublishConsumer {
        constructor(@Inject(CACHE_MANAGER) readonly cache: Cache) {}
      }

      @Module({
        imports: [createRedisCacheOptions('lg-advert-publications')],
        providers: [PublishingConsumer],
      })
      class PublishingTaskModule {}

      @Module({
        imports: [createRedisCacheOptions('lg-advert-publications')],
        providers: [PublicationConsumer],
      })
      class PublicationProviderModule {}

      @Module({
        imports: [createRedisCacheOptions('lg-advert-publications')],
        providers: [AdvertPublishConsumer],
      })
      class AdvertPublishProviderModule {}

      @Module({
        imports: [
          PublishingTaskModule,
          PublicationProviderModule,
          AdvertPublishProviderModule,
        ],
      })
      class RootModule {}

      const testingModule = await Test.createTestingModule({
        imports: [RootModule],
      }).compile()

      const container = testingModule.get(ModulesContainer)

      // CHARACTERIZED: three registerAsync objects hash identically on Nest 10,
      // so exactly one CacheModule -- and one Redis client -- exists.
      expect(countModules(container, 'CacheModule')).toBe(1)

      // CHARACTERIZED: one cache manager instance, not three.
      expect(countProviders(container, 'CACHE_MANAGER')).toBe(1)

      // CHARACTERIZED: the three consuming modules resolve the SAME object.
      // On Nest 11 each consumer gets its own cache manager, so a value written
      // through one is invisible to the other two.
      const publishing = testingModule.get(PublishingConsumer)
      const publication = testingModule.get(PublicationConsumer)
      const advertPublish = testingModule.get(AdvertPublishConsumer)

      expect(publishing.cache).toBe(publication.cache)
      expect(publishing.cache).toBe(advertPublish.cache)

      await testingModule.close()
    }, 60000)

    /**
     * Latent bug, independent of the version bump.
     *
     * `createRedisCacheOptions(namespace)` captures `namespace` in the closure
     * passed as `useFactory`. Nest 10's module-token hash serializes functions
     * with `Function.prototype.toString()`, which yields identical source text
     * regardless of the captured value -- so the namespace never reaches the
     * hash. Two calls with DIFFERENT namespaces are therefore indistinguishable
     * to the deduplicator and collapse into a single cache whose namespace is
     * whichever call was scanned first.
     *
     * No app hits this today: legal-gazette-api only ever asks for
     * 'lg-advert-publications' and official-journal only for 'ojoi-journal'.
     * The other three StoreKeyMapper values ('ojoi-case', 'ojoi-user',
     * 'ojoi-statistics') are declared but unused. The first app to use two
     * namespaces at once would silently share one.
     */
    it('ignores the namespace when deduplicating', async () => {
      @Module({ imports: [createRedisCacheOptions('ojoi-case')] })
      class CaseModule {}

      @Module({ imports: [createRedisCacheOptions('ojoi-user')] })
      class UserModule {}

      @Module({ imports: [CaseModule, UserModule] })
      class RootModule {}

      const testingModule = await Test.createTestingModule({
        imports: [RootModule],
      }).compile()

      const container = testingModule.get(ModulesContainer)

      // CHARACTERIZED: two DIFFERENT namespaces still produce one CacheModule.
      // This is a bug, not a property worth keeping -- if the Nest 11 bump makes
      // this 2, that is the bug being fixed, and the expectation should be
      // updated rather than the code reverted.
      expect(countModules(container, 'CacheModule')).toBe(1)

      await testingModule.close()
    }, 60000)
  })

  describe('TBRModule.forRoot', () => {
    /**
     * legal-gazette-api calls `TBRModule.forRoot(...)` from four modules:
     * payments.provider, payment.task, publication.listener and
     * subscriber.provider.
     */
    it('collapses identical configs into one module', async () => {
      const config = {
        credentials: 'test-credentials',
        officeId: 'test-office',
        tbrBasePath: 'https://tbr.test/api',
      }

      @Module({ imports: [TBRModule.forRoot({ ...config })] })
      class PaymentsProviderModule {}

      @Module({ imports: [TBRModule.forRoot({ ...config })] })
      class PaymentTaskModule {}

      @Module({ imports: [TBRModule.forRoot({ ...config })] })
      class PublicationListenerModule {}

      @Module({ imports: [TBRModule.forRoot({ ...config })] })
      class SubscriberProviderModule {}

      @Module({
        imports: [
          PaymentsProviderModule,
          PaymentTaskModule,
          PublicationListenerModule,
          SubscriberProviderModule,
        ],
      })
      class RootModule {}

      // TBRService validates credentials in its constructor and needs a logger;
      // this suite is about module identity, not about the service itself.
      const testingModule = await Test.createTestingModule({
        imports: [RootModule],
      })
        .overrideProvider(ITBRService)
        .useValue({})
        .compile()

      const container = testingModule.get(ModulesContainer)

      // CHARACTERIZED: four forRoot calls, one module instance on Nest 10.
      expect(countModules(container, 'TBRModule')).toBe(1)

      // CHARACTERIZED: one config provider, not four. On Nest 11 this becomes
      // four TBRService instances, each with its own HTTP client state.
      expect(countProviders(container, String(ITBRConfig))).toBe(1)

      await testingModule.close()
    }, 60000)

    /**
     * Latent inconsistency at the real call sites, visible on Nest 10 already.
     *
     * payments.provider, payment.task and publication.listener read the TBR env
     * vars with a non-null assertion (`process.env.X!`), while
     * subscriber.provider falls back to an empty string (`process.env.X || ''`).
     * When the env vars are set the four configs serialize identically and
     * collapse. When they are UNSET the first three serialize to `{}` (undefined
     * values are dropped) and the fourth to `{"credentials":"", ...}` -- two
     * different hashes, so subscriber.provider already gets its own TBRModule.
     */
    it('splits when one call site spells an absent value differently', async () => {
      const assertedConfig = {
        credentials: undefined as unknown as string,
        officeId: undefined as unknown as string,
        tbrBasePath: undefined as unknown as string,
      }
      const defaultedConfig = { credentials: '', officeId: '', tbrBasePath: '' }

      @Module({ imports: [TBRModule.forRoot({ ...assertedConfig })] })
      class AssertingModule {}

      @Module({ imports: [TBRModule.forRoot({ ...defaultedConfig })] })
      class DefaultingModule {}

      @Module({ imports: [AssertingModule, DefaultingModule] })
      class RootModule {}

      const testingModule = await Test.createTestingModule({
        imports: [RootModule],
      })
        .overrideProvider(ITBRService)
        .useValue({})
        .compile()

      const container = testingModule.get(ModulesContainer)

      // CHARACTERIZED: `undefined` and `''` hash differently, so the two call
      // sites do NOT collapse. The four real call sites should agree on one
      // spelling; until they do, TBR module identity depends on whether the
      // deployment has the env vars set.
      expect(countModules(container, 'TBRModule')).toBe(2)

      await testingModule.close()
    }, 60000)
  })

  describe('the real legal-gazette-api container', () => {
    let container: ModulesContainer

    beforeAll(async () => {
      const testingModule = await Test.createTestingModule({
        imports: [AppModule],
      })
        .overrideProvider(Sequelize)
        .useValue({ repositoryMode: false, close: () => Promise.resolve() })
        .compile()

      container = testingModule.get(ModulesContainer)
    }, 120000)

    it('opens exactly one database connection', () => {
      // SPECIFIED: one pool per process. `SequelizeModule.forRootAsync` is
      // called once, so this must survive the bump -- a second
      // SequelizeCoreModule would mean a second pool against a database whose
      // connection budget is already sized for one.
      expect(countModules(container, 'SequelizeCoreModule')).toBe(1)
      expect(countProviders(container, 'Sequelize')).toBe(1)
    })

    it('builds exactly one cache manager', () => {
      // CHARACTERIZED: three createRedisCacheOptions call sites, one client.
      expect(countModules(container, 'CacheModule')).toBe(1)
      expect(countProviders(container, 'CACHE_MANAGER')).toBe(1)
    })

    it('builds exactly one TBR module', () => {
      // CHARACTERIZED: four TBRModule.forRoot call sites, one module.
      expect(countModules(container, 'TBRModule')).toBe(1)
    })

    it('has only the known duplicate SequelizeModule instances', () => {
      const signatures = sequelizeSignatures(container)
      const duplicated = [
        ...new Set(
          signatures.filter((s, index) => signatures.indexOf(s) !== index),
        ),
      ]

      // CHARACTERIZED: `SequelizeModule.forFeature` hashes the model array in
      // order, so `[AdvertModel, AdvertPublicationModel]` and
      // `[AdvertPublicationModel, AdvertModel]` already fail to collapse today.
      // Two such pairs exist. On Nest 11 every forFeature call site becomes its
      // own module and this list grows to cover every repeated model set.
      expect(duplicated).toEqual([
        'AdvertModelRepository + AdvertPublicationModelRepository + ApplicationConfig + ModuleRef',
        'ApplicationConfig + ModuleRef',
      ])
    })
  })
})
