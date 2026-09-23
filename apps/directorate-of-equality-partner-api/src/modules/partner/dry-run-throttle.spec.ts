import { GUARDS_METADATA } from '@nestjs/common/constants'
import { Reflector } from '@nestjs/core'
import { ThrottlerException, ThrottlerStorage } from '@nestjs/throttler'

import {
  ApiKeyThrottlerGuard,
  DryRunThrottlerGuard,
} from '../../core/guards/api-key-throttler/api-key-throttler.guard'
import {
  PER_IP_THROTTLER,
  PER_KEY_DRY_RUN_THROTTLER,
  PER_KEY_THROTTLER,
} from '../../core/guards/throttlers'
import { PartnerController } from './partner.controller'

const OPTIONS = [
  { name: PER_KEY_THROTTLER, ttl: 3600000, limit: 5000 },
  { name: PER_KEY_DRY_RUN_THROTTLER, ttl: 3600000, limit: 500 },
  { name: PER_IP_THROTTLER, ttl: 60000, limit: 600, setHeaders: false },
]

/**
 * A **real** `Reflector`, unlike the throttler guard specs next door, and that
 * is the whole point: the thing under test is whether the decorators on the
 * handler are there and are honoured. A mocked reflector would assert our own
 * stub back at us.
 */
const contextFor = (
  handler: (...args: never[]) => unknown,
  header: jest.Mock = jest.fn(),
) =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({ apiKeyContext: { keyId: 'key-1' } }),
      getResponse: () => ({ header }),
    }),
    getHandler: () => handler,
    getClass: () => PartnerController,
  }) as never

const okIncrement = () =>
  jest.fn().mockResolvedValue({
    totalHits: 1,
    timeToExpire: 60,
    isBlocked: false,
    timeToBlockExpire: 0,
  })

const blockedIncrement = () =>
  jest.fn().mockResolvedValue({
    totalHits: 501,
    timeToExpire: 60,
    isBlocked: true,
    timeToBlockExpire: 42,
  })

const build = async <T>(
  Guard: new (...args: never[]) => T,
  increment: jest.Mock,
  options: typeof OPTIONS = OPTIONS,
): Promise<T> => {
  const guard = new Guard(
    ...([
      options,
      { increment } as unknown as ThrottlerStorage,
      new Reflector(),
    ] as never[]),
  )

  await (guard as { onModuleInit(): Promise<void> }).onModuleInit()

  return guard
}

const analyze = PartnerController.prototype.analyzeSalaryReport as unknown as (
  ...args: never[]
) => unknown
const submit = PartnerController.prototype.submitSalaryReport as unknown as (
  ...args: never[]
) => unknown

/**
 * The dry run has its own allowance so that rehearsing a filing cannot spend the
 * budget the filing needs. That guarantee is not in any one place — it is two
 * decorators agreeing: `@SkipThrottle` taking the route out of the surface-wide
 * bucket, and `@UseGuards(DryRunThrottlerGuard)` putting it into its own.
 *
 * Drop either one and the route still works, still rate-limits, and silently
 * stops doing the thing it was changed to do: without the skip it spends both
 * budgets, and without the guard it is unlimited. Neither shows up in any other
 * test, which is why this file exists.
 */
describe('the dry run spends its own allowance', () => {
  it('does not count against the surface-wide per-key bucket', async () => {
    const increment = okIncrement()
    const guard = await build(ApiKeyThrottlerGuard, increment)

    await guard.canActivate(contextFor(analyze))

    expect(increment).not.toHaveBeenCalled()
  })

  it('counts against its own bucket instead', async () => {
    const increment = okIncrement()
    const guard = await build(DryRunThrottlerGuard, increment)

    await guard.canActivate(contextFor(analyze))

    expect(increment).toHaveBeenCalledTimes(1)
    expect(increment.mock.calls[0][4]).toBe(PER_KEY_DRY_RUN_THROTTLER)
  })

  /**
   * The other half of the separation, and the one a reader is most likely to
   * doubt: the skip is scoped to this route, so filing still spends the
   * allowance it always did.
   */
  it('leaves the submission counting against the surface-wide bucket', async () => {
    const increment = okIncrement()
    const guard = await build(ApiKeyThrottlerGuard, increment)

    await guard.canActivate(contextFor(submit))

    expect(increment).toHaveBeenCalledTimes(1)
    expect(increment.mock.calls[0][4]).toBe(PER_KEY_THROTTLER)
  })

  it('does not lend the dry-run allowance to the submission', async () => {
    const increment = okIncrement()
    const guard = await build(DryRunThrottlerGuard, increment)

    await guard.canActivate(contextFor(submit))

    // The guard is route-scoped by @UseGuards, so it never sees the submission
    // in production. If it ever did, it must not hand it a second budget.
    expect(increment.mock.calls.map((call) => call[4])).not.toContain(
      PER_KEY_THROTTLER,
    )
  })

  /**
   * The half the tests above cannot see. They construct `DryRunThrottlerGuard`
   * themselves, so they would all still pass with the `@UseGuards` removed from
   * the route — at which point the dry run is bounded by nothing but the per-IP
   * ceiling. This asserts the route actually asks for the guard.
   *
   * `GUARDS_METADATA` is Nest's own key for `@UseGuards`, imported rather than
   * hardcoded. If Nest ever renames it this fails loudly on the next run, which
   * is the failure mode to want.
   */
  it('is actually applied to the route, not merely available to it', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, analyze) ?? []

    expect(guards).toContain(DryRunThrottlerGuard)
  })

  it('keeps the two buckets in separate storage keys', async () => {
    const shared = okIncrement()
    const dryRun = okIncrement()

    await (
      await build(ApiKeyThrottlerGuard, shared)
    ).canActivate(contextFor(submit))
    await (
      await build(DryRunThrottlerGuard, dryRun)
    ).canActivate(contextFor(analyze))

    expect(shared.mock.calls[0][0]).not.toBe(dryRun.mock.calls[0][0])
  })

  /**
   * With no throttler matching its bucket the base class allows every request,
   * and the dry run has skipped the surface-wide bucket — so a config entry
   * deleted as "unused" would leave the route with no per-key limit at all.
   * The guard refuses to start instead.
   */
  it.each<[string, new (...args: never[]) => unknown, string]>([
    ['DryRunThrottlerGuard', DryRunThrottlerGuard, PER_KEY_DRY_RUN_THROTTLER],
    ['ApiKeyThrottlerGuard', ApiKeyThrottlerGuard, PER_KEY_THROTTLER],
  ])(
    '%s refuses to start when its bucket is not configured',
    async (_name, Guard, bucket) => {
      const options = OPTIONS.filter((throttler) => throttler.name !== bucket)

      await expect(build(Guard, okIncrement(), options)).rejects.toThrow(bucket)
    },
  )

  /**
   * `@nestjs/throttler` suffixes `Retry-After` with the bucket name, which
   * would leave a generic retry layer with no standard header to read.
   */
  it('sends the standard Retry-After on a dry-run 429', async () => {
    const header = jest.fn()
    const guard = await build(DryRunThrottlerGuard, blockedIncrement())

    await expect(
      guard.canActivate(contextFor(analyze, header)),
    ).rejects.toBeInstanceOf(ThrottlerException)

    expect(header).toHaveBeenCalledWith('Retry-After', 42)
    expect(header).toHaveBeenCalledWith(
      `Retry-After-${PER_KEY_DRY_RUN_THROTTLER}`,
      42,
    )
  })
})
