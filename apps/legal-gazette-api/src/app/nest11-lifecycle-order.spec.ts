import {
  BeforeApplicationShutdown,
  Global,
  Inject,
  Injectable,
  Module,
  OnApplicationShutdown,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common'
import { Test } from '@nestjs/testing'

/**
 * Nest 11 reverses the order of the termination hooks (`OnModuleDestroy`,
 * `BeforeApplicationShutdown`, `OnApplicationShutdown`).
 *
 * What Nest 10 actually does -- read from
 * `NestApplicationContext.getModulesToTriggerHooksOn` and
 * `DependenciesScanner.calculateModulesDistance` -- is sort every module by
 * DESCENDING distance from the root module and walk that single ordering for
 * init and for teardown alike. Distance is plain graph depth; there is no
 * special case for `@Global()`, so a global module leads only when it happens
 * to be declared first among modules at the same depth. The upstream note that
 * "global modules initialise first and are destroyed last" describes the Nest 11
 * result, not a Nest 10 rule about globals.
 *
 * The practical consequence today: a module's teardown hook runs AFTER the
 * modules it imports have already been torn down. Nest 11 inverts that, so any
 * hook written against one arrangement misbehaves under the other -- silently,
 * with no type error and no boot failure.
 *
 * Expectations are labelled CHARACTERIZED (measured against Nest 10; the bump is
 * expected to flip these) or SPECIFIED (a decision made now).
 */

const record: string[] = []

const probe = (label: string) => {
  @Injectable()
  class Probe
    implements
      OnModuleInit,
      OnModuleDestroy,
      BeforeApplicationShutdown,
      OnApplicationShutdown
  {
    onModuleInit() {
      record.push(`${label}:init`)
    }
    onModuleDestroy() {
      record.push(`${label}:destroy`)
    }
    beforeApplicationShutdown() {
      record.push(`${label}:beforeShutdown`)
    }
    onApplicationShutdown() {
      record.push(`${label}:shutdown`)
    }
  }
  return Probe
}

describe('Nest 11 termination hook order', () => {
  beforeEach(() => {
    record.length = 0
  })

  it('walks a nested graph deepest-first in every phase', async () => {
    const LeafProbe = probe('leaf')
    const MidProbe = probe('mid')
    const RootProbe = probe('root')

    @Module({ providers: [LeafProbe] })
    class LeafModule {}

    @Module({ imports: [LeafModule], providers: [MidProbe] })
    class MidModule {}

    @Module({ imports: [MidModule], providers: [RootProbe] })
    class RootModule {}

    const testingModule = await Test.createTestingModule({
      imports: [RootModule],
    }).compile()

    const app = testingModule.createNestApplication()
    await app.init()
    await app.close()

    // CHARACTERIZED: one ordering -- deepest module first -- drives init and
    // teardown alike. On Nest 11 the three teardown phases invert to
    // root, mid, leaf while init stays leaf, mid, root.
    expect(record).toEqual([
      'leaf:init',
      'mid:init',
      'root:init',
      'leaf:destroy',
      'mid:destroy',
      'root:destroy',
      'leaf:beforeShutdown',
      'mid:beforeShutdown',
      'root:beforeShutdown',
      'leaf:shutdown',
      'mid:shutdown',
      'root:shutdown',
    ])
  }, 60000)

  it('destroys an imported module before the module that imports it', async () => {
    const seen: string[] = []

    @Injectable()
    class LocalResource implements OnModuleDestroy {
      private open = true

      describe(): string {
        return this.open ? 'open' : 'closed'
      }

      onModuleDestroy() {
        this.open = false
      }
    }

    @Injectable()
    class Flusher implements OnModuleDestroy {
      constructor(
        @Inject(LocalResource) private readonly resource: LocalResource,
      ) {}

      onModuleDestroy() {
        // Reads an injected dependency during its own teardown -- the shape of
        // any "flush the queue / close the connection on shutdown" hook.
        seen.push(this.resource.describe())
      }
    }

    @Module({ providers: [LocalResource], exports: [LocalResource] })
    class LocalResourceModule {}

    @Module({ imports: [LocalResourceModule], providers: [Flusher] })
    class FlusherModule {}

    @Module({ imports: [FlusherModule] })
    class RootModule {}

    const testingModule = await Test.createTestingModule({
      imports: [RootModule],
    }).compile()

    const app = testingModule.createNestApplication()
    await app.init()
    await app.close()

    // CHARACTERIZED: the imported module sits deeper, so it is destroyed first
    // and the flusher observes an already-closed dependency. On Nest 11 the
    // order inverts and this reads 'open'. Either way the hook silently gets a
    // different world than its author tested against -- which is why no
    // teardown hook in this repo should depend on a dependency's state.
    expect(seen).toEqual(['closed'])
  }, 60000)

  it('breaks ties between equally deep modules by declaration order', async () => {
    const FirstProbe = probe('first')
    const SecondProbe = probe('second')

    @Global()
    @Module({ providers: [FirstProbe], exports: [FirstProbe] })
    class GlobalFirstModule {}

    @Module({ providers: [SecondProbe] })
    class PlainSecondModule {}

    @Module({ imports: [GlobalFirstModule, PlainSecondModule] })
    class RootModule {}

    const testingModule = await Test.createTestingModule({
      imports: [RootModule],
    }).compile()

    const app = testingModule.createNestApplication()
    await app.init()
    await app.close()

    // CHARACTERIZED: both modules are one hop from the root, so the descending
    // distance sort is a tie and the stable sort keeps container insertion
    // order -- i.e. the order they are listed in `imports`. `@Global()` earns
    // no priority of its own; swapping the two entries in `imports` swaps the
    // hook order. Teardown follows the same ordering as init on Nest 10.
    expect(record).toEqual([
      'first:init',
      'second:init',
      'first:destroy',
      'second:destroy',
      'first:beforeShutdown',
      'second:beforeShutdown',
      'first:shutdown',
      'second:shutdown',
    ])
  }, 60000)

  it('fires no termination hook unless the app is closed', async () => {
    const Probe = probe('unclosed')

    @Module({ providers: [Probe] })
    class ProbeModule {}

    const testingModule = await Test.createTestingModule({
      imports: [ProbeModule],
    }).compile()

    const app = testingModule.createNestApplication()
    await app.init()

    // SPECIFIED: every phase is driven by app.close() -- note that all four
    // fire below WITHOUT enableShutdownHooks(), which only installs the OS
    // signal listeners that would call close() for you. No main.ts in this repo
    // calls either, so on a deployed pod none of these hooks run at all and
    // reordering them in Nest 11 changes nothing in production. If a later
    // change enables shutdown hooks, this expectation is the reminder that the
    // ordering above suddenly starts to matter.
    expect(record).toEqual(['unclosed:init'])

    await app.close()
    expect(record).toEqual([
      'unclosed:init',
      'unclosed:destroy',
      'unclosed:beforeShutdown',
      'unclosed:shutdown',
    ])
  }, 60000)
})
