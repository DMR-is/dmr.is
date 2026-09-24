'use client'

import { useState } from 'react'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Tag } from '@dmr.is/ui/components/island-is/Tag'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { type ApiKeyDto } from '../../gen/fetch/types.gen'
import {
  formatDateIS,
  isNarrowGrant,
  issuedBy,
  KEY_STATE_LABEL,
  KEY_STATE_VARIANT,
  keyState,
} from '../../lib/format'
import { keyText as t } from '../../lib/text'

/** The fields a company key and a provider key have in common. */
export type ListedKey = {
  id: string
  keyId: string
  label?: string | null
  /** Company keys only — a provider key has no scopes of its own. */
  scopes?: ApiKeyDto['scopes']
  createdVia: 'ISLAND_IS' | 'ADMIN'
  createdByNationalId?: string | null
  createdAt: string
  expiresAt?: string | null
  lastUsedAt?: string | null
  revokedAt?: string | null
}

type Props = {
  keys: ListedKey[]
  emptyText: string
  onRevoke: (key: ListedKey) => void
}

const KeyCard = ({
  apiKey,
  onRevoke,
}: {
  apiKey: ListedKey
  onRevoke: (key: ListedKey) => void
}) => {
  const state = keyState(apiKey)
  const narrow =
    state === 'active' && !!apiKey.scopes && isNarrowGrant(apiKey.scopes)

  return (
    <Box border="standard" borderRadius="large" padding={3}>
      <Stack space={1}>
        <Inline space={2} justifyContent="spaceBetween" alignY="center">
          <Text variant="h5">{apiKey.label ?? apiKey.keyId}</Text>
          <Inline space={1}>
            {narrow && (
              <Tag variant="purple" outlined disabled>
                {t.narrowTag}
              </Tag>
            )}
            <Tag variant={KEY_STATE_VARIANT[state]} outlined disabled>
              {KEY_STATE_LABEL[state]}
            </Tag>
          </Inline>
        </Inline>

        {/* The public half only. There is no secret to show: the API stores a
            hash, so nothing can render one. */}
        <Text variant="small" color="dark400">
          {t.colKeyId}: {apiKey.keyId}
        </Text>
        <Text variant="small" color="dark400">
          {t.colCreated}: {formatDateIS(apiKey.createdAt)} · {t.colCreatedBy}:{' '}
          {issuedBy(apiKey)}
        </Text>
        <Text variant="small" color="dark400">
          {t.colExpires}:{' '}
          {apiKey.expiresAt ? formatDateIS(apiKey.expiresAt) : t.noExpiry} ·{' '}
          {t.colLastUsed}:{' '}
          {apiKey.lastUsedAt ? formatDateIS(apiKey.lastUsedAt) : t.neverUsed}
        </Text>

        {narrow && (
          <Text variant="small" color="purple600">
            {t.narrowHint}
          </Text>
        )}

        {state === 'active' && (
          <Inline justifyContent="flexEnd">
            <Button
              variant="text"
              size="small"
              colorScheme="destructive"
              onClick={() => onRevoke(apiKey)}
            >
              {t.revokeButton}
            </Button>
          </Inline>
        )}
      </Stack>
    </Box>
  )
}

/**
 * Keys in use first; revoked and expired ones folded away. The API keeps every
 * key as an audit trail, which after a few rotations would otherwise bury the
 * one key that matters under the ones that no longer do anything.
 */
export const KeyList = ({ keys, emptyText, onRevoke }: Props) => {
  const [showInactive, setShowInactive] = useState(false)

  const active = keys.filter((key) => keyState(key) === 'active')
  const inactive = keys.filter((key) => keyState(key) !== 'active')

  if (keys.length === 0) {
    return <Text>{emptyText}</Text>
  }

  return (
    <Stack space={2}>
      {active.length === 0 && <Text>{emptyText}</Text>}
      {active.map((key) => (
        <KeyCard key={key.id} apiKey={key} onRevoke={onRevoke} />
      ))}

      {inactive.length > 0 && (
        <>
          <Box>
            <Button
              variant="text"
              size="small"
              icon={showInactive ? 'chevronUp' : 'chevronDown'}
              iconType="outline"
              onClick={() => setShowInactive((shown) => !shown)}
            >
              {showInactive ? t.hideRevoked : t.showRevoked(inactive.length)}
            </Button>
          </Box>
          {showInactive &&
            inactive.map((key) => (
              <KeyCard key={key.id} apiKey={key} onRevoke={onRevoke} />
            ))}
        </>
      )}
    </Stack>
  )
}
