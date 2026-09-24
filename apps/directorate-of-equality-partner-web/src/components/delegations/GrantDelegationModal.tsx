'use client'

import { useEffect, useMemo, useState } from 'react'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Checkbox } from '@dmr.is/ui/components/island-is/Checkbox'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Select } from '@dmr.is/ui/components/island-is/Select'
import { SkeletonLoader } from '@dmr.is/ui/components/island-is/SkeletonLoader'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'
import { Modal } from '@dmr.is/ui/components/Modal/Modal'

import {
  type ApiScope,
  FILING_SCOPES,
  formatNationalId,
  SCOPE_ORDER,
} from '../../lib/format'
import { delegationText, scopeText, sharedText } from '../../lib/text'
import { useTRPC } from '../../lib/trpc/client/trpc'

import { useMutation, useQueryClient } from '@tanstack/react-query'

const t = delegationText.modal

type Props = {
  isOpen: boolean
  onClose: () => void
  companyName: string
  /** Providers the company has already allowed, left out of the choice: a
   *  second grant to the same provider is refused with a 409. */
  delegatedProviderIds: string[]
}

/**
 * The consent moment. A company names a provider from Jafnréttisstofa's
 * approved list and says, scope by scope, what it may do.
 *
 * Checkboxes rather than the key modal's two-way choice: this is the company
 * agreeing to let someone else act, and each thing agreed to should be read.
 *
 * Only the provider's approved scopes can be ticked. The API refuses a grant
 * beyond them with a 400, and a company should learn that from a disabled box
 * with a reason, not from an error after confirming. The filing scopes are
 * ticked by default; `scoring:write` never is, since it can delete the
 * company's starfsmat.
 */
export const GrantDelegationModal = ({
  isOpen,
  onClose,
  companyName,
  delegatedProviderIds,
}: Props) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const [providerId, setProviderId] = useState<string | null>(null)
  const [scopes, setScopes] = useState<ApiScope[]>([])

  const {
    data: providersData,
    isLoading,
    isError,
  } = useQuery({
    ...trpc.delegation.listProviders.queryOptions(),
    enabled: isOpen,
  })

  const providers = useMemo(
    () =>
      (providersData?.providers ?? []).filter(
        (provider) => !delegatedProviderIds.includes(provider.id),
      ),
    [providersData, delegatedProviderIds],
  )

  const provider = providers.find((p) => p.id === providerId) ?? null

  useEffect(() => {
    if (isOpen) {
      setProviderId(null)
      setScopes([])
    }
  }, [isOpen])

  const grant = useMutation({
    ...trpc.delegation.grant.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.delegation.list.queryKey(),
      })
      toast.success(t.grantedToast)
      onClose()
    },
    onError: (error) => {
      const reason = error.data?.translatedMessage
      toast.error(
        reason ? `${t.grantErrorToast} - ${reason}` : t.grantErrorToast,
        { autoClose: 5000 },
      )
    },
  })

  const selectProvider = (id: string) => {
    setProviderId(id)
    const approved = providers.find((p) => p.id === id)?.scopes ?? []
    setScopes(FILING_SCOPES.filter((scope) => approved.includes(scope)))
  }

  const toggle = (scope: ApiScope, checked: boolean) =>
    setScopes((current) =>
      checked
        ? [...current, scope]
        : current.filter((existing) => existing !== scope),
    )

  const options = providers.map((p) => ({
    value: p.id,
    label: `${p.name} (${formatNationalId(p.nationalId)})`,
  }))

  const renderBody = () => {
    if (isLoading) {
      return <SkeletonLoader repeat={2} height={40} space={2} />
    }

    if (isError) {
      return (
        <AlertMessage
          type="error"
          title={sharedText.loadErrorTitle}
          message={t.providersLoadError}
        />
      )
    }

    if (providers.length === 0) {
      return <AlertMessage type="info" title={t.noProviders} />
    }

    return (
      <Stack space={3}>
        <Text>{t.intro}</Text>

        <Select
          name="grant-delegation-provider"
          size="sm"
          label={t.providerLabel}
          placeholder={t.providerPlaceholder}
          options={options}
          value={options.find((o) => o.value === providerId) ?? null}
          onChange={(opt) => {
            if (opt) selectProvider(opt.value)
          }}
        />

        {provider && (
          <>
            <Stack space={2}>
              <Text variant="h5" as="h3">
                {t.scopesLabel}
              </Text>
              {SCOPE_ORDER.map((scope) => {
                const approved = provider.scopes.includes(scope)

                return (
                  <Checkbox
                    key={scope}
                    name={`grant-scope-${scope}`}
                    label={scopeText.labels[scope]}
                    subLabel={
                      approved
                        ? scopeText.descriptions[scope]
                        : scopeText.notApproved
                    }
                    checked={scopes.includes(scope)}
                    disabled={!approved}
                    onChange={(event) => toggle(scope, event.target.checked)}
                  />
                )
              })}
            </Stack>

            {scopes.length === 0 ? (
              <Text variant="small" color="red600">
                {t.scopesRequired}
              </Text>
            ) : (
              <Box background="blue100" borderRadius="large" padding={2}>
                <Text variant="small">
                  {t.summary(provider.name, companyName)}
                </Text>
              </Box>
            )}
          </>
        )}
      </Stack>
    )
  }

  return (
    <Modal
      baseId="grant-delegation-modal"
      isVisible={isOpen}
      title={t.title}
      onVisibilityChange={(visible) => {
        if (!visible) onClose()
      }}
      toggleClose={onClose}
      width="small"
      // Pinned, so the confirm button stays in reach while the scope list
      // scrolls on a short screen. `allowOverflow` would stop that scrolling.
      footer={
        <Inline space={2} justifyContent="flexEnd">
          <Button variant="ghost" size="small" onClick={onClose}>
            {sharedText.cancel}
          </Button>
          <Button
            size="small"
            disabled={!provider || scopes.length === 0}
            loading={grant.isPending}
            onClick={() => {
              if (!provider || scopes.length === 0) return
              grant.mutate({ partnerClientId: provider.id, scopes })
            }}
          >
            {t.confirmButton}
          </Button>
        </Inline>
      }
    >
      {renderBody()}
    </Modal>
  )
}
