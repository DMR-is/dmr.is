import { CanActivate, ExecutionContext } from '@nestjs/common'

import { getLogger } from '@dmr.is/logging'

import { claimValues } from './token-surface/token-surface'

const logger = getLogger('MachineClientGuard')

/**
 * Machine clients (company and foreclosure systems) must carry every scope
 * listed in LEGAL_GAZETTE_MACHINE_CLIENT_SCOPES, each matched exactly. The
 * variable is space- or comma-separated, and an empty list refuses everyone.
 *
 * Every, not some: the old check required the whole variable as one substring
 * of the token's scope, so a multi-scope value meant all of them.
 */
export class MachineClientGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredScopes = (
      process.env.LEGAL_GAZETTE_MACHINE_CLIENT_SCOPES ?? ''
    )
      .split(/[\s,]+/)
      .filter(Boolean)

    if (!requiredScopes.length) {
      logger.error(
        'Missing required environment variable: LEGAL_GAZETTE_MACHINE_CLIENT_SCOPES',
      )
      return false
    }

    const user = context.switchToHttp().getRequest().user
    const scopes = claimValues(user?.scope)

    return requiredScopes.every((scope) => scopes.includes(scope))
  }
}
