'use client'

import { useState } from 'react'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { SkeletonLoader } from '@dmr.is/ui/components/island-is/SkeletonLoader'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Tag } from '@dmr.is/ui/components/island-is/Tag'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'
import { Modal } from '@dmr.is/ui/components/Modal/Modal'

import { CreatePartnerClientModal } from '../../components/partner-clients/CreatePartnerClientModal'
import { PartnerClientKeys } from '../../components/partner-clients/PartnerClientKeys'
import { type PartnerClientDto } from '../../gen/fetch/types.gen'
import { formatDateIS } from '../../lib/constants'
import { partnerClientsText, serverErrorText } from '../../lib/text'
import { useTRPC } from '../../lib/trpc/client/trpc'
import { formatNationalId } from '../../lib/utils'

import { useMutation, useQueryClient } from '@tanstack/react-query'

const t = partnerClientsText

/**
 * The approved firms, newest first, revoked ones included so the list is also
 * the audit view. Each firm's keys load only when opened.
 *
 * Mutations are offered to every reviewer, as on a company's key tab; the API
 * refuses anyone without the ADMIN role, and the toast says so.
 */
export const PartnerClientsContainer = () => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [openKeysFor, setOpenKeysFor] = useState<string | null>(null)
  const [pendingRevoke, setPendingRevoke] = useState<PartnerClientDto | null>(
    null,
  )

  const { data, isLoading, isError } = useQuery(
    trpc.partnerClient.list.queryOptions(),
  )

  const revoke = useMutation({
    ...trpc.partnerClient.revoke.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.partnerClient.list.queryKey(),
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

  const clients = data?.partnerClients ?? []

  return (
    <GridContainer>
      <GridRow>
        <GridColumn
          span={['12/12', '12/12', '10/12']}
          offset={['0', '0', '1/12']}
        >
          <Stack space={3}>
            <Inline justifyContent="flexEnd">
              <Button size="small" onClick={() => setIsCreateOpen(true)}>
                {t.createButton}
              </Button>
            </Inline>

            {isLoading && <SkeletonLoader repeat={3} height={96} space={2} />}

            {isError && (
              <AlertMessage
                type="error"
                title={serverErrorText.title}
                message={t.loadError}
              />
            )}

            {!isLoading && !isError && clients.length === 0 && (
              <Text>{t.empty}</Text>
            )}

            {clients.map((client) => {
              const revoked = Boolean(client.revokedAt)
              const keysOpen = openKeysFor === client.id

              return (
                <Box
                  key={client.id}
                  background="white"
                  border="standard"
                  borderRadius="large"
                  padding={3}
                >
                  <Stack space={2}>
                    <Inline
                      space={2}
                      justifyContent="spaceBetween"
                      alignY="center"
                    >
                      <Text variant="h4">{client.name}</Text>
                      <Tag variant={revoked ? 'red' : 'blue'} disabled>
                        {revoked ? t.statusRevoked : t.statusActive}
                      </Tag>
                    </Inline>

                    <Text variant="small" color="dark400">
                      {t.colNationalId}: {formatNationalId(client.nationalId)} ·{' '}
                      {t.colCreated}: {formatDateIS(client.createdAt)}
                    </Text>

                    <Inline space={1}>
                      {client.scopes.map((scope) => (
                        <Tag key={scope} variant="blueberry" outlined disabled>
                          {t.scopeLabels[scope] ?? scope}
                        </Tag>
                      ))}
                    </Inline>

                    <Inline space={2} justifyContent="flexEnd">
                      <Button
                        variant="text"
                        size="small"
                        onClick={() =>
                          setOpenKeysFor(keysOpen ? null : client.id)
                        }
                      >
                        {keysOpen ? t.hideKeys : t.showKeys}
                      </Button>
                      {!revoked && (
                        <Button
                          variant="text"
                          size="small"
                          colorScheme="destructive"
                          onClick={() => setPendingRevoke(client)}
                        >
                          {t.revokeButton}
                        </Button>
                      )}
                    </Inline>

                    {keysOpen && (
                      <PartnerClientKeys
                        partnerClientId={client.id}
                        canIssue={!revoked}
                      />
                    )}
                  </Stack>
                </Box>
              )
            })}
          </Stack>
        </GridColumn>
      </GridRow>

      <CreatePartnerClientModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      <Modal
        baseId="revoke-partner-client-modal"
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
            title={pendingRevoke?.name ?? ''}
            message={t.revokeConfirmMessage}
          />
          <Inline space={2} justifyContent="flexEnd">
            <Button
              variant="ghost"
              size="small"
              onClick={() => setPendingRevoke(null)}
            >
              {t.createModal.cancelButton}
            </Button>
            <Button
              size="small"
              colorScheme="destructive"
              loading={revoke.isPending}
              onClick={() => {
                if (!pendingRevoke) return
                revoke.mutate({ id: pendingRevoke.id })
              }}
            >
              {t.revokeConfirmButton}
            </Button>
          </Inline>
        </Stack>
      </Modal>
    </GridContainer>
  )
}
