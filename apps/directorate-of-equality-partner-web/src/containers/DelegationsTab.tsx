'use client'

import { useState } from 'react'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'

import { ConfirmModal } from '../components/ConfirmModal'
import { GrantDelegationModal } from '../components/delegations/GrantDelegationModal'
import { ScopeTags } from '../components/scopes/ScopeTags'
import { type CompanyPartnerDelegationDto } from '../gen/fetch/types.gen'
import { formatDateIS, formatNationalId } from '../lib/format'
import { delegationText as t } from '../lib/text'
import { useTRPC } from '../lib/trpc/client/trpc'
import { TabError, TabLoading, withReason } from './TabState'

import { useMutation, useQueryClient } from '@tanstack/react-query'

const DelegationCard = ({
  delegation,
  onRevoke,
}: {
  delegation: CompanyPartnerDelegationDto
  onRevoke: () => void
}) => (
  <Box border="standard" borderRadius="large" padding={3}>
    <Stack space={1}>
      <Inline space={2} justifyContent="spaceBetween" alignY="center">
        <Text variant="h5">{delegation.provider.name}</Text>
        <Button
          variant="text"
          size="small"
          colorScheme="destructive"
          onClick={onRevoke}
        >
          {t.revokeButton}
        </Button>
      </Inline>
      <Text variant="small" color="dark400">
        {t.providerNationalId}:{' '}
        {formatNationalId(delegation.provider.nationalId)}
      </Text>
      <Text variant="small" color="dark400">
        {t.grantedAt}: {formatDateIS(delegation.grantedAt)} · {t.grantedBy}:{' '}
        {formatNationalId(delegation.grantedByNationalId)}
      </Text>
      <Box marginTop={1}>
        <ScopeTags scopes={delegation.scopes} />
      </Box>
    </Stack>
  </Box>
)

/**
 * The providers that may file for the company, and the controls to allow a new
 * one or withdraw one. The list is the live delegation rows the partner API
 * itself enforces, so what is shown is exactly who can file.
 */
export const DelegationsTab = ({ companyName }: { companyName: string }) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const [isGrantOpen, setIsGrantOpen] = useState(false)
  const [pendingRevoke, setPendingRevoke] =
    useState<CompanyPartnerDelegationDto | null>(null)

  const { data, isLoading, isError } = useQuery(
    trpc.delegation.list.queryOptions(),
  )

  const revoke = useMutation({
    ...trpc.delegation.revoke.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.delegation.list.queryKey(),
      })
      toast.success(t.revokedToast)
      setPendingRevoke(null)
    },
    onError: (error) => {
      toast.error(withReason(t.revokeErrorToast, error), { autoClose: 5000 })
      setPendingRevoke(null)
    },
  })

  const delegations = data?.delegations ?? []

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
            // Not before the list loads: the modal leaves out providers already
            // delegated to, and an empty list would offer them all, each failing
            // with a 409.
            disabled={isLoading || isError}
            onClick={() => setIsGrantOpen(true)}
          >
            {t.grantButton}
          </Button>
        </Inline>

        {/* Inline, so a failed refetch does not unmount a half-filled
            consent form. */}
        {isLoading ? (
          <TabLoading />
        ) : isError ? (
          <TabError message={t.loadError} />
        ) : delegations.length === 0 ? (
          <Text>{t.empty}</Text>
        ) : (
          <Stack space={2}>
            {delegations.map((delegation) => (
              <DelegationCard
                key={delegation.id}
                delegation={delegation}
                onRevoke={() => setPendingRevoke(delegation)}
              />
            ))}
            <Text variant="small" color="dark400">
              {t.changeHint}
            </Text>
          </Stack>
        )}
      </Stack>

      <GrantDelegationModal
        isOpen={isGrantOpen}
        onClose={() => setIsGrantOpen(false)}
        companyName={companyName}
        delegatedProviderIds={delegations.map((d) => d.provider.id)}
      />

      <ConfirmModal
        baseId="revoke-delegation"
        isOpen={pendingRevoke !== null}
        title={t.revokeConfirmTitle}
        subject={pendingRevoke?.provider.name ?? ''}
        message={t.revokeConfirmMessage(pendingRevoke?.provider.name ?? '')}
        confirmLabel={t.revokeConfirmButton}
        isPending={revoke.isPending}
        onConfirm={() =>
          pendingRevoke && revoke.mutate({ id: pendingRevoke.id })
        }
        onClose={() => setPendingRevoke(null)}
      />
    </Box>
  )
}
