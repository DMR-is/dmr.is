'use client'

import { useEffect, useMemo, useState } from 'react'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Bullet } from '@dmr.is/ui/components/island-is/Bullet'
import { BulletList } from '@dmr.is/ui/components/island-is/BulletList'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { RadioButton } from '@dmr.is/ui/components/island-is/RadioButton'
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

const PROVIDER_GROUP_LABEL_ID = 'grant-delegation-provider-label'

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

        {/* Above the choice, not below it: on a phone a box under the list is
            out of view while the pinned Confirm button is already enabled, so
            full access — the starfsmat delete included — could be granted
            without it ever being on screen. It reads the same for every
            provider, so it needs no selection to show. */}
        <Box background="blue100" borderRadius="large" padding={3}>
          <Stack space={2}>
            <Text fontWeight="semiBold">{t.handoverTitle}</Text>
            <BulletList type="ul">
              {t.handoverItems.map((item) => (
                <Bullet key={item}>{item}</Bullet>
              ))}
            </BulletList>
          </Stack>
        </Box>

        {/* Radio buttons, not a Select: island-ui's Select renders its menu
            inline, so inside a scrolling modal it is clipped, and letting it
            overflow instead pushed the confirm button off the card on a phone.
            The approved list is short, and a list scrolls where a menu cannot.
            The group is labelled so a screen reader announces the question
            with each option. */}
        <div role="radiogroup" aria-labelledby={PROVIDER_GROUP_LABEL_ID}>
          <Stack space={2}>
            <Text variant="h5" as="h3" id={PROVIDER_GROUP_LABEL_ID}>
              {t.providerLabel}
            </Text>
            {providers.map((p) => (
              <RadioButton
                key={p.id}
                id={`grant-delegation-provider-${p.id}`}
                name="grant-delegation-provider"
                value={p.id}
                label={p.name}
                subLabel={formatNationalId(p.nationalId)}
                checked={providerId === p.id}
                onChange={() => setProviderId(p.id)}
                large
                backgroundColor="blue"
              />
            ))}
          </Stack>
        </div>
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
      // Pinned, so the confirm button stays in reach while the body scrolls on
      // a phone. Safe now there is no Select menu for the scroll area to clip.
      footer={
        <Stack space={2}>
          {/* Beside the button that acts on it, so the sentence naming the
              provider is on screen whenever Confirm can be pressed. */}
          {provider && (
            <Text variant="small">{t.summary(provider.name, companyName)}</Text>
          )}
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
      }
    >
      {renderBody()}
    </Modal>
  )
}
