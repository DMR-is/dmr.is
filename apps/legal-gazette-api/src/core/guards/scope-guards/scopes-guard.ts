import { Observable } from 'rxjs'

import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import { ACTOR_SCOPES_KEY, SCOPES_KEY } from './scopes.decorator'

// This guard is used by legal-gazette-api for scope-based authorization
// legal-gazette-public-web users should have the scope '@logbirtingablad.is/logbirtingabladid'
// legal-gazette-application-web users should have the scope '@logbirtingablad.is/lg-application-web'
// We need to make sure that endpoints used respectively by these two clients
// are protected by this guard with the appropriate @Scopes() decorator.

@Injectable()
export class ScopesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const scopes = this.reflector.getAllAndOverride<string[]>(SCOPES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    const actorScopes = this.reflector.getAllAndOverride<string[]>(
      ACTOR_SCOPES_KEY,
      [context.getHandler(), context.getClass()],
    )
    const req = context.switchToHttp().getRequest()

    if (scopes && !this.hasScope(scopes, req.user?.scope)) {
      return false
    }

    if (
      actorScopes &&
      !this.hasScope(
        actorScopes,
        req.user?.actor ? req.user.actor.scope : req.user?.scope,
      )
    ) {
      return false
    }

    return true
  }

  private parseScopes(scopes: undefined | string | string[]): string[] {
    if (scopes === undefined) {
      return []
    }
    if (typeof scopes === 'string') {
      return scopes.split(' ')
    }
    return scopes
  }

  private hasScope(
    needScopes: string[],
    haveScopes: string | string[],
  ): boolean {
    const parsed = this.parseScopes(haveScopes)
    return needScopes.some((scope) => parsed.includes(scope))
  }
}
