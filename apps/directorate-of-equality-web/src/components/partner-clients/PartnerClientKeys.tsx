'use client'

import { useState } from 'react'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { SkeletonLoader } from '@dmr.is/ui/components/island-is/SkeletonLoader'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Tag } from '@dmr.is/ui/components/island-is/Tag'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'
import { Modal } from '@dmr.is/ui/components/Modal/Modal'

import { type PartnerClientKeyDto } from '../../gen/fetch/types.gen'
import { formatDateIS } from '../../lib/constants'
import {
  companiesText,
  partnerClientsText,
  serverErrorText,
} from '../../lib/text'
import { useTRPC } from '../../lib/trpc/client/trpc'
import { IssuePartnerClientKeyModal } from './IssuePartnerClientKeyModal'

import { useMutation, useQueryClient } from '@tanstack/react-query'

/** Key labels and states read the same as on a company's key tab. */
const k = companiesText.detailView.apiKeys
const t = partnerClientsText.keys

type KeyState = 'active' | 'revoked' | 'expired'

const keyState = (key: PartnerClientKeyDto): KeyState => {
  if (key.revokedAt) return 'revoked'
  if (key.expiresAt && new Date(key.expiresAt) <= new Date()) return 'expired'
  return 'active'
}

const STATE_LABEL: Record<KeyState, string> = {
  active: k.statusActive,
  revoked: k.statusRevoked,
  expired: k.statusExpired,
}

const STATE_VARIANT: Record<KeyState, 'blue' | 'red' | 'disabled'> = {
  active: 'blue',
  revoked: 'red',
  expired: 'disabled',
}

const issuedBy = (key: PartnerClientKeyDto): string =>
  key.createdVia === 'ADMIN'
    ? k.createdViaAdmin
    : `${k.createdViaIslandIs}${
        key.createdByNationalId ? ` · ${key.createdByNationalId}` : ''
      }`

type Props = {
  partnerClientId: string
  /** False for a revoked firm, which the API refuses to issue keys for. */
  canIssue: boolean
}

export const PartnerClientKeys = ({ partnerClientId, canIssue }: Props) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const [isIssueOpen, setIsIssueOpen] = useState(false)
  const [pendingRevoke, setPendingRevoke] =
    useState<PartnerClientKeyDto | null>(null)

  const { data, isLoading, isError } = useQuery(
    trpc.partnerClient.listKeys.queryOptions({ id: partnerClientId }),
  )

  const revoke = useMutation({
    ...trpc.partnerClient.revokeKey.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.partnerClient.listKeys.queryKey({ id: partnerClientId }),
      })
      toast.success(t.revokedToast)
      setPendingRevoke(null)
    },
    onError: (error) => {
      const translated = error.data?.translatedMessage
      toast.error(
        translated
          ? `${t.revokeErrorToast} - ${translated}`
          : t.revokeErrorToast,
        { autoClose: 5000 },
      )
      setPendingRevoke(null)
    },
  })

  if (isLoading) {
    return <SkeletonLoader repeat={2} height={64} space={2} />
  }

  if (isError) {
    return (
      <AlertMessage
        type="error"
        title={serverErrorText.title}
        message={t.loadError}
      />
    )
  }

  const keys = data?.keys ?? []

  return (
    <Box borderTopWidth="standard" borderColor="blue200" paddingTop={2}>
      <Stack space={2}>
        <Text variant="small" color="dark400">
          {t.intro}
        </Text>

        {canIssue && (
          <Inline justifyContent="flexEnd">
            <Button size="small" onClick={() => setIsIssueOpen(true)}>
              {t.issueButton}
            </Button>
          </Inline>
        )}

        {keys.length === 0 ? (
          <Text variant="small">{t.empty}</Text>
        ) : (
          keys.map((key) => {
            const state = keyState(key)

            return (
              <Box
                key={key.id}
                border="standard"
                borderRadius="large"
                padding={2}
              >
                <Stack space={1}>
                  <Inline
                    space={2}
                    justifyContent="spaceBetween"
                    alignY="center"
                  >
                    <Text variant="h5">{key.label ?? key.keyId}</Text>
                    <Tag variant={STATE_VARIANT[state]} disabled>
                      {STATE_LABEL[state]}
                    </Tag>
                  </Inline>
                  <Text variant="small" color="dark400">
                    {k.colKeyId}: {key.keyId}
                  </Text>
                  <Text variant="small" color="dark400">
                    {k.colCreated}: {formatDateIS(key.createdAt)} ·{' '}
                    {k.colCreatedBy}: {issuedBy(key)}
                  </Text>
                  <Text variant="small" color="dark400">
                    {k.colLastUsed}:{' '}
                    {key.lastUsedAt
                      ? formatDateIS(key.lastUsedAt)
                      : k.neverUsed}
                  </Text>
                  {state === 'active' && (
                    <Inline justifyContent="flexEnd">
                      <Button
                        variant="text"
                        size="small"
                        colorScheme="destructive"
                        onClick={() => setPendingRevoke(key)}
                      >
                        {k.revokeButton}
                      </Button>
                    </Inline>
                  )}
                </Stack>
              </Box>
            )
          })
        )}
      </Stack>

      <IssuePartnerClientKeyModal
        partnerClientId={partnerClientId}
        isOpen={isIssueOpen}
        onClose={() => setIsIssueOpen(false)}
      />

      <Modal
        baseId="revoke-partner-client-key-modal"
        isVisible={pendingRevoke !== null}
        title={k.revokeConfirmTitle}
        onVisibilityChange={(visible) => {
          if (!visible) setPendingRevoke(null)
        }}
        toggleClose={() => setPendingRevoke(null)}
        width="small"
      >
        <Stack space={3}>
          <AlertMessage
            type="warning"
            title={pendingRevoke?.label ?? pendingRevoke?.keyId ?? ''}
            message={t.revokeConfirmMessage}
          />
          <Inline space={2} justifyContent="flexEnd">
            <Button
              variant="ghost"
              size="small"
              onClick={() => setPendingRevoke(null)}
            >
              {k.modal.cancelButton}
            </Button>
            <Button
              size="small"
              colorScheme="destructive"
              loading={revoke.isPending}
              onClick={() => {
                if (!pendingRevoke) return
                revoke.mutate({ id: partnerClientId, keyId: pendingRevoke.id })
              }}
            >
              {k.revokeConfirmButton}
            </Button>
          </Inline>
        </Stack>
      </Modal>
    </Box>
  )
}
