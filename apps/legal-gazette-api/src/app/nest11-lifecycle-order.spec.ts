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
 * What Nest 10 did -- read from
 * `NestApplicationContext.getModulesToTriggerHooksOn` and
 * `DependenciesScanner.calculateModulesDistance` -- was sort every module by
 * DESCENDING distance from the root module and walk that single ordering for
 * init and for teardown alike, so a module's teardown hook ran AFTER the modules
 * it imports had already been torn down. Distance is plain graph depth; there is
 * no special case for `@Global()`, so a global module leads only when it happens
 * to be declared first among modules at the same depth.
 *
 * Measured on the bump: Nest 11 keeps init deepest-first and reverses all three
 * teardown phases to root-first. The upstream note that "global modules
 * initialise first and are destroyed last" describes this Nest 11 result, not a
 * Nest 10 rule about globals.
 *
 * The flip is silent -- no type error, no boot failure -- so any hook written
 * against one arrangement misbehaves under the other. It is inert in this repo
 * today for the reason spelled out in the last test below: nothing calls
 * `enableShutdownHooks()` or `close()`, so on a deployed pod none of these hooks
 * run at all.
 *
 * Expectations are labelled NEST 11 BASELINE (measured after the bump, with the
 * superseded Nest 10 value named in the comment) or SPECIFIED (a decision made
 * now).
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

  it('initialises deepest-first and tears down root-first', async () => {
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

    // NEST 11 BASELINE: init still walks deepest-first (leaf, mid, root), but
    // all three teardown phases now walk root-first. On Nest 10 a single
    // descending-distance ordering drove every phase, so teardown also ran
    // leaf, mid, root:
    //
    //   leaf:destroy,        mid:destroy,        root:destroy
    //   leaf:beforeShutdown, mid:beforeShutdown, root:beforeShutdown
    //   leaf:shutdown,       mid:shutdown,       root:shutdown
    expect(record).toEqual([
      'leaf:init',
      'mid:init',
      'root:init',
      'root:destroy',
      'mid:destroy',
      'leaf:destroy',
      'root:beforeShutdown',
      'mid:beforeShutdown',
      'leaf:beforeShutdown',
      'root:shutdown',
      'mid:shutdown',
      'leaf:shutdown',
    ])
  }, 60000)

  it('destroys the importing module before the module it imports', async () => {
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

    // NEST 11 BASELINE: 'open'. The importing module is torn down first, so the
    // flusher still sees a live dependency -- which is the arrangement a
    // "flush the queue on shutdown" hook actually wants. On Nest 10 this read
    // 'closed': the imported module sat deeper and was destroyed first, so the
    // flusher observed an already-closed dependency.
    //
    // The reading flipped without a type error or a boot failure, which is why
    // no teardown hook in this repo should depend on a dependency's state.
    expect(seen).toEqual(['open'])
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

    // NEST 11 BASELINE: both modules are one hop from the root, so the sort is a
    // tie and the stable sort keeps the order they are listed in `imports`.
    // `@Global()` still earns no priority of its own -- swapping the two entries
    // swaps the hook order. Init keeps declaration order; teardown reverses it,
    // so the globally-declared module is now destroyed LAST. That is the
    // arrangement the upstream "global modules are destroyed last" note
    // describes; it was not true on Nest 10, where teardown ran in declaration
    // order too:
    //
    //   first:destroy,        second:destroy
    //   first:beforeShutdown, second:beforeShutdown
    //   first:shutdown,       second:shutdown
    expect(record).toEqual([
      'first:init',
      'second:init',
      'second:destroy',
      'first:destroy',
      'second:beforeShutdown',
      'first:beforeShutdown',
      'second:shutdown',
      'first:shutdown',
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
