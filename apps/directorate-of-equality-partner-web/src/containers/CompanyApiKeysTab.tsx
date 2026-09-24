'use client'

import { useRef, useState } from 'react'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'

import { ConfirmModal } from '../components/ConfirmModal'
import { IssueKeyModal } from '../components/keys/IssueKeyModal'
import { KeyList, type ListedKey } from '../components/keys/KeyList'
import { apiKeyText as t, keyText } from '../lib/text'
import { useTRPC } from '../lib/trpc/client/trpc'
import { TabError, TabLoading, withReason } from './TabState'

import { useMutation, useQueryClient } from '@tanstack/react-query'

/**
 * The company's own keys, for filing directly from its own software instead of
 * through a provider.
 */
export const CompanyApiKeysTab = () => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const [isIssueOpen, setIsIssueOpen] = useState(false)
  // Read when a request settles: closed by then means nobody will see the
  // key, so it must not stay in the mutation observer.
  const isIssueOpenRef = useRef(false)
  isIssueOpenRef.current = isIssueOpen
  const [pendingRevoke, setPendingRevoke] = useState<ListedKey | null>(null)

  const { data, isLoading, isError } = useQuery(trpc.apiKey.list.queryOptions())

  // Fire-and-forget. Returned from `onSuccess`, the promise would be awaited
  // before `mutateAsync` resolves, so a failing refetch would hold back — and,
  // were the modal not mounted regardless, destroy — the one-time secret.
  const invalidate = () => {
    void queryClient.invalidateQueries({
      queryKey: trpc.apiKey.list.queryKey(),
    })
  }

  const issue = useMutation({
    ...trpc.apiKey.issue.mutationOptions(),
    // Evicted as soon as nothing observes it, so the plaintext secret does not
    // sit in the mutation cache for the default five minutes.
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
    ...trpc.apiKey.revoke.mutationOptions(),
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

        <Inline justifyContent="flexEnd">
          <Button
            size="small"
            icon="add"
            iconType="outline"
            onClick={() => setIsIssueOpen(true)}
          >
            {t.issueButton}
          </Button>
        </Inline>

        {/* Inline rather than an early return: the modals below must stay
            mounted, or a failed refetch while a new key is on screen would
            unmount the only place its secret is shown. */}
        {isLoading ? (
          <TabLoading />
        ) : isError ? (
          <TabError message={t.loadError} />
        ) : (
          <KeyList
            keys={data?.apiKeys ?? []}
            emptyText={t.empty}
            onRevoke={setPendingRevoke}
          />
        )}
      </Stack>

      <IssueKeyModal
        baseId="issue-company-api-key"
        title={t.modal.title}
        labelPlaceholder={t.modal.labelPlaceholder}
        withScopes
        isOpen={isIssueOpen}
        isPending={issue.isPending}
        onIssue={async (input) => (await issue.mutateAsync(input)).key}
        onClose={() => {
          setIsIssueOpen(false)
          // Not while in flight: resetting detaches the pending request, so a
          // second Create could then replace a key nobody has seen yet.
          if (!issue.isPending) issue.reset()
        }}
      />

      <ConfirmModal
        baseId="revoke-company-api-key"
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
