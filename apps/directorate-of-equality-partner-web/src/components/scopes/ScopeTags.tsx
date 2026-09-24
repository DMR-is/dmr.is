import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Tag } from '@dmr.is/ui/components/island-is/Tag'

import { type ApiScope, scopeLabel, sortScopes } from '../../lib/format'

/**
 * One tag per scope, in a fixed order. `scoring:write` stands out because it is
 * the one that can delete the company's starfsmat.
 */
export const ScopeTags = ({ scopes }: { scopes: ApiScope[] }) => (
  <Inline space={1} flexWrap="wrap">
    {sortScopes(scopes).map((scope) => (
      <Tag
        key={scope}
        variant={scope === 'scoring:write' ? 'purple' : 'blue'}
        outlined
        disabled
      >
        {scopeLabel(scope)}
      </Tag>
    ))}
  </Inline>
)
