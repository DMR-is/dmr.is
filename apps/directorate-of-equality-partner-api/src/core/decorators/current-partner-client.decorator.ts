import { createParamDecorator, ExecutionContext } from '@nestjs/common'

/**
 * The vendor client acting for `CurrentCompany`, or null when the request came
 * on the company's own key. Set by `PartnerCompanyGuard` from the verified
 * credential, so it can only ever name the firm that actually authenticated.
 *
 * Null is a real answer here, not a missing one, so unlike `CurrentCompany`
 * this does not throw.
 */
export const CurrentPartnerClientId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | null =>
    ctx.switchToHttp().getRequest()?.partnerClientId ?? null,
)
