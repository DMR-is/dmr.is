import { SetMetadata } from '@nestjs/common'

import { ApiKeyScopeEnum } from '@dmr.is/doe-shared'

export const API_SCOPE_METADATA = 'doeApiScope'

/**
 * Declares which scope a handler requires.
 *
 * Scopes are stored per key and default to the full set, so most keys will
 * satisfy most handlers — the point is that a company *can* issue a narrowed
 * key, and that narrowing has to be enforced somewhere. Here.
 */
export const RequireApiScope = (scope: ApiKeyScopeEnum) =>
  SetMetadata(API_SCOPE_METADATA, scope)
