'use client'

import { useEffect, useMemo, useState } from 'react'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Bullet } from '@dmr.is/ui/components/island-is/Bullet'
import { BulletList } from '@dmr.is/ui/components/island-is/BulletList'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Select } from '@dmr.is/ui/components/island-is/Select'
import { SkeletonLoader } from '@dmr.is/ui/components/island-is/SkeletonLoader'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'
import { Modal } from '@dmr.is/ui/components/Modal/Modal'

import { formatNationalId } from '../../lib/format'
import { delegationText, sharedText } from '../../lib/text'
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
 * The consent moment: the company names a provider from Jafnréttisstofa's
 * approved list and hands it the job.
 *
 * All or nothing. No scopes are offered or sent, and the API then grants
 * everything the provider was approved for. Scope-by-scope consent asked
 * employers a question few could answer — and a provider allowed to file but
 * not to author the starfsmat cannot file for a company whose starfsmat it
 * maintains. What is handed over is spelled out instead, so the one choice
 * left is made knowingly.
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
    if (isOpen) setProviderId(null)
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
            if (opt) setProviderId(opt.value)
          }}
        />

        {provider && (
          <Box background="blue100" borderRadius="large" padding={3}>
            <Stack space={2}>
              <Text fontWeight="semiBold">
                {t.handoverTitle(provider.name)}
              </Text>
              <BulletList type="ul">
                {t.handoverItems.map((item) => (
                  <Bullet key={item}>{item}</Bullet>
                ))}
              </BulletList>
              <Text variant="small">
                {t.summary(provider.name, companyName)}
              </Text>
            </Stack>
          </Box>
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
      // The provider Select renders its menu inline — island-ui's Select does
      // not forward `menuPortalTarget` — so any scrolling container clips it.
      // A pinned `footer` made the body one, and the open menu was cut off at
      // the footer's edge. `allowOverflow` lets it spill over the modal
      // instead; safe because the form is a select and a short summary, well
      // under the 80vh the modal would otherwise have scrolled at.
      allowOverflow
    >
      <Stack space={3}>
        {renderBody()}

        <Inline space={2} justifyContent="flexEnd">
          <Button variant="ghost" size="small" onClick={onClose}>
            {sharedText.cancel}
          </Button>
          <Button
            size="small"
            disabled={!provider}
            loading={grant.isPending}
            onClick={() => {
              if (!provider) return
              grant.mutate({ partnerClientId: provider.id })
            }}
          >
            {t.confirmButton}
          </Button>
        </Inline>
      </Stack>
    </Modal>
  )
}
