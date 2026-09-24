'use client'

import { useRef, useState } from 'react'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Divider } from '@dmr.is/ui/components/island-is/Divider'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'

import { ConfirmModal } from '../components/ConfirmModal'
import { InfoItems } from '../components/InfoItems'
import { IssueKeyModal } from '../components/keys/IssueKeyModal'
import { KeyList, type ListedKey } from '../components/keys/KeyList'
import { ScopeTags } from '../components/scopes/ScopeTags'
import { type PartnerClientDto } from '../gen/fetch/types.gen'
import { formatDateIS } from '../lib/format'
import { keyText, providerText as t } from '../lib/text'
import { useTRPC } from '../lib/trpc/client/trpc'
import { TabError, TabLoading, withReason } from './TabState'

import { useMutation, useQueryClient } from '@tanstack/react-query'

/**
 * An approved provider's own vendor keys (`doev_…`). Shown only to an
 * organisation Jafnréttisstofa has approved, which the API decides.
 */
export const ProviderKeysTab = ({
  partnerClient,
}: {
  partnerClient: PartnerClientDto
}) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const [isIssueOpen, setIsIssueOpen] = useState(false)
  // Read when a request settles: closed by then means nobody will see the
  // key, so it must not stay in the mutation observer.
  // Kept in step by the two handlers below rather than assigned during
  // render, which React Compiler and react-hooks v6 flag.
  const isIssueOpenRef = useRef(false)
  const openIssue = () => {
    isIssueOpenRef.current = true
    setIsIssueOpen(true)
  }
  const [pendingRevoke, setPendingRevoke] = useState<ListedKey | null>(null)

  const { data, isLoading, isError } = useQuery(
    trpc.partnerClient.listKeys.queryOptions(),
  )

  // Fire-and-forget, as in CompanyApiKeysTab: an awaited refetch would hold
  // back the one-time secret.
  const invalidate = () => {
    void queryClient.invalidateQueries({
      queryKey: trpc.partnerClient.listKeys.queryKey(),
    })
  }

  const issue = useMutation({
    ...trpc.partnerClient.issueKey.mutationOptions(),
    gcTime: 0,
    onSuccess: invalidate,
    onSettled: () => {
      // The modal was closed while this was in flight, so its close skipped
      // `reset()`. Clear the plaintext key now that the request is done.
      if (!isIssueOpenRef.current) issue.reset()
    },
    onError: (error) =>
      toast.error(withReason(keyText.modal.createErrorToast, error), {
        autoClose: 5000,
      }),
  })

  const revoke = useMutation({
    ...trpc.partnerClient.revokeKey.mutationOptions(),
    onSuccess: () => {
      invalidate()
      toast.success(keyText.revokedToast)
      setPendingRevoke(null)
    },
    onError: (error) => {
      toast.error(withReason(keyText.revokeErrorToast, error), {
        autoClose: 5000,
      })
      setPendingRevoke(null)
    },
  })

  return (
    <Box marginTop={4}>
      <Stack space={3}>
        <Text variant="h4" as="h3">
          {t.heading}
        </Text>
        <Text>{t.intro}</Text>

        <InfoItems
          items={[
            {
              label: t.approvedScopes,
              children: <ScopeTags scopes={partnerClient.scopes} />,
            },
            {
              label: t.approvedAt,
              children: formatDateIS(partnerClient.createdAt),
            },
          ]}
        />

        <Divider />

        <Inline space={2} justifyContent="spaceBetween" alignY="center">
          <Text variant="small" color="dark400">
            {t.rotationHint}
          </Text>
          <Button
            size="small"
            icon="add"
            iconType="outline"
            onClick={openIssue}
          >
            {t.issueButton}
          </Button>
        </Inline>

        {isLoading ? (
          <TabLoading />
        ) : isError ? (
          <TabError message={t.loadError} />
        ) : (
          <KeyList
            keys={data?.keys ?? []}
            emptyText={t.empty}
            onRevoke={setPendingRevoke}
          />
        )}
      </Stack>

      <IssueKeyModal
        baseId="issue-provider-key"
        title={t.modal.title}
        labelPlaceholder={t.modal.labelPlaceholder}
        withScopes={false}
        isOpen={isIssueOpen}
        isPending={issue.isPending}
        onIssue={async ({ label, expiresAt }) =>
          (await issue.mutateAsync({ label, expiresAt })).key
        }
        onClose={() => {
          isIssueOpenRef.current = false
          setIsIssueOpen(false)
          if (!issue.isPending) issue.reset()
        }}
      />

      <ConfirmModal
        baseId="revoke-provider-key"
        isOpen={pendingRevoke !== null}
        title={t.revokeConfirmTitle}
        subject={pendingRevoke?.label ?? pendingRevoke?.keyId ?? ''}
        message={t.revokeConfirmMessage}
        confirmLabel={keyText.revokeConfirmButton}
        isPending={revoke.isPending}
        onConfirm={() =>
          pendingRevoke && revoke.mutate({ id: pendingRevoke.id })
        }
        onClose={() => setPendingRevoke(null)}
      />
    </Box>
  )
}
