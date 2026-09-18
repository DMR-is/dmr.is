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

import { ApiKeyDto } from '../../../../gen/fetch'
import { formatDateIS } from '../../../../lib/constants'
import { companiesText, serverErrorText } from '../../../../lib/text'
import { useTRPC } from '../../../../lib/trpc/client/trpc'
import { IssueApiKeyModal } from './IssueApiKeyModal'

import { useMutation, useQueryClient } from '@tanstack/react-query'

const t = companiesText.detailView.apiKeys

type Props = {
  companyId: string
}

type KeyState = 'active' | 'revoked' | 'expired'

/**
 * A key is shown as revoked before expired when it is both: revocation is a
 * decision somebody made and wants to see reflected, expiry is just time
 * passing.
 */
const keyState = (key: ApiKeyDto): KeyState => {
  if (key.revokedAt) return 'revoked'
  if (key.expiresAt && new Date(key.expiresAt) <= new Date()) return 'expired'
  return 'active'
}

const STATE_LABEL: Record<KeyState, string> = {
  active: t.statusActive,
  revoked: t.statusRevoked,
  expired: t.statusExpired,
}

const STATE_VARIANT: Record<KeyState, 'blue' | 'red' | 'disabled'> = {
  active: 'blue',
  revoked: 'red',
  expired: 'disabled',
}

/**
 * Who minted the key. The two issuance paths record different kinds of actor —
 * a reviewer has a `doe_user` row, a company's own representative does not — so
 * there is no single column to read and the origin decides which one applies.
 */
const issuedBy = (key: ApiKeyDto): string =>
  key.createdVia === 'ADMIN'
    ? t.createdViaAdmin
    : `${t.createdViaIslandIs}${
        key.createdByNationalId ? ` · ${key.createdByNationalId}` : ''
      }`

export const CompanyApiKeysTab = ({ companyId }: Props) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const [isIssueOpen, setIsIssueOpen] = useState(false)
  const [pendingRevoke, setPendingRevoke] = useState<ApiKeyDto | null>(null)

  const { data, isLoading, isError } = useQuery(
    trpc.apiKey.listForCompany.queryOptions({ companyId }),
  )

  const revoke = useMutation({
    ...trpc.apiKey.revoke.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.apiKey.listForCompany.queryKey({ companyId }),
      })
      // The timeline gains an API_KEY_REVOKED entry, so it is stale too.
      queryClient.invalidateQueries({
        queryKey: trpc.company.getTimeline.queryKey({ id: companyId }),
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
    return (
      <Box marginTop={4}>
        <SkeletonLoader repeat={2} height={80} space={2} />
      </Box>
    )
  }

  if (isError) {
    return (
      <Box marginTop={4}>
        <AlertMessage
          type="error"
          title={serverErrorText.title}
          message={t.loadError}
        />
      </Box>
    )
  }

  const keys = data?.apiKeys ?? []

  return (
    <Box marginTop={4}>
      <Stack space={3}>
        <Text variant="small" color="dark400">
          {t.intro}
        </Text>

        <Inline justifyContent="flexEnd">
          <Button size="small" onClick={() => setIsIssueOpen(true)}>
            {t.issueButton}
          </Button>
        </Inline>

        {keys.length === 0 ? (
          <Text>{t.empty}</Text>
        ) : (
          <Stack space={2}>
            {keys.map((key) => {
              const state = keyState(key)

              return (
                <Box
                  key={key.id}
                  border="standard"
                  borderRadius="large"
                  padding={3}
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

                    {/* The public half only. There is no secret to show — the
                        API stores a hash, so nothing can render one. */}
                    <Text variant="small" color="dark400">
                      {t.colKeyId}: {key.keyId}
                    </Text>
                    <Text variant="small" color="dark400">
                      {t.colCreated}: {formatDateIS(key.createdAt)} ·{' '}
                      {t.colCreatedBy}: {issuedBy(key)}
                    </Text>
                    <Text variant="small" color="dark400">
                      {t.colLastUsed}:{' '}
                      {key.lastUsedAt
                        ? formatDateIS(key.lastUsedAt)
                        : t.neverUsed}
                    </Text>

                    {state === 'active' && (
                      <Inline justifyContent="flexEnd">
                        <Button
                          variant="text"
                          size="small"
                          colorScheme="destructive"
                          onClick={() => setPendingRevoke(key)}
                        >
                          {t.revokeButton}
                        </Button>
                      </Inline>
                    )}
                  </Stack>
                </Box>
              )
            })}
          </Stack>
        )}
      </Stack>

      <IssueApiKeyModal
        companyId={companyId}
        isOpen={isIssueOpen}
        onClose={() => setIsIssueOpen(false)}
      />

      <Modal
        baseId="revoke-api-key-modal"
        isVisible={pendingRevoke !== null}
        title={t.revokeConfirmTitle}
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
              {t.modal.cancelButton}
            </Button>
            <Button
              size="small"
              colorScheme="destructive"
              loading={revoke.isPending}
              onClick={() => {
                if (!pendingRevoke) return
                revoke.mutate({ companyId, id: pendingRevoke.id })
              }}
            >
              {t.revokeConfirmButton}
            </Button>
          </Inline>
        </Stack>
      </Modal>
    </Box>
  )
}
