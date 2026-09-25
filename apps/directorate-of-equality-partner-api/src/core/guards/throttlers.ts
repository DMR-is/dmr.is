import { ExecutionContext } from '@nestjs/common'

import { ApiKeyKindEnum } from '@dmr.is/doe-shared'

/**
 * The two surface-wide rate-limit buckets, and why there are two of them.
 *
 * They answer different questions and, critically, they run at different points
 * in the request. `PER_KEY_THROTTLER` needs to know *which tenant* is calling,
 * so it can only run after `ApiKeyGuard` has verified a credential — which means
 * it never sees a request that failed authentication. `PER_IP_THROTTLER` runs as
 * a global guard, before every other guard, so it is the only one that can count
 * a rejected credential at all.
 *
 * A single throttler cannot do both jobs: whichever position it takes, it is
 * blind to the other half of the traffic.
 *
 * Names matter beyond identification. `@nestjs/throttler` suffixes its response
 * headers with the throttler name for every name except `default`, so the
 * per-key bucket keeps that name to leave `X-RateLimit-Limit` and friends
 * unsuffixed on the published contract.
 */
export const PER_KEY_THROTTLER = 'default'
export const PER_IP_THROTTLER = 'perIp'

/**
 * A third bucket, for the dry run alone, and it exists to protect the vendor
 * rather than us.
 *
 * The dry run is optional and repeatable: a vendor iterating on a payroll
 * extract calls it as often as the extract changes, which is the point of it.
 * Every one of those calls would otherwise spend the same per-key allowance the
 * *filing* needs — so a debugging session could leave a company unable to submit
 * its report, having done nothing wrong. The two activities want separate
 * budgets because exhausting one must not be able to block the other.
 *
 * It is not a cost defence. A dry run does strictly less work than the
 * submission it rehearses, so anything that can afford to file can afford to
 * rehearse; the ceiling is against a loop, not against use.
 */
export const PER_KEY_DRY_RUN_THROTTLER = 'perKeyDryRun'

/** The surface-wide per-key allowance for a company key, per hour. */
export const COMPANY_KEY_LIMIT_PER_HOUR = 5000

/**
 * The same allowance for a vendor client key, which spends it across every
 * company the firm acts for. Higher because one firm's key carries its whole
 * book; one bucket per key rather than per company, because the firm manages
 * its own customers' traffic and needs no isolation between them from us.
 */
export const PARTNER_CLIENT_KEY_LIMIT_PER_HOUR = 10000

/**
 * `PER_KEY_THROTTLER`'s limit, resolved per request from the key's kind.
 *
 * A function on the one bucket rather than a second named bucket, because
 * `@nestjs/throttler` suffixes every header with the bucket name for any name
 * but `default` — a separate vendor bucket would move every vendor response's
 * `X-RateLimit-*` headers to suffixed names, the problem the dry run has.
 *
 * Runs after `ApiKeyGuard`, so the context is set; a request without one is
 * refused by the throttler's own tracker before this value could matter.
 */
export const perKeyLimit = (context: ExecutionContext): number =>
  context.switchToHttp().getRequest()?.apiKeyContext?.kind ===
  ApiKeyKindEnum.PARTNER_CLIENT
    ? PARTNER_CLIENT_KEY_LIMIT_PER_HOUR
    : COMPANY_KEY_LIMIT_PER_HOUR
