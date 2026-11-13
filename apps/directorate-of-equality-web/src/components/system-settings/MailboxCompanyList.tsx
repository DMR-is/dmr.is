'use client'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'

import { MAILBOX_ALLOWLIST_CONFIG_KEY } from '../../lib/constants'
import { systemSettingsText } from '../../lib/text'
import { useTRPC } from '../../lib/trpc/client/trpc'
import { formatNationalId } from '../../lib/utils'

import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query'

const t = systemSettingsText.mailbox

type Props = {
  nationalIds: string[]
  /** The stored value the list was read from, sent as `expectedValue`. */
  storedValue: string
}

/**
 * The named companies, by name and kennitala, each with its own remove.
 * Removing is the safe direction (fewer mailboxes, more email), so it saves at
 * once; removing the last leaves `none`. Names come from the register search,
 * which reaches every company; a kennitala not in the register shows as
 * unknown.
 */
export const MailboxCompanyList = ({ nationalIds, storedValue }: Props) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const lookups = useQueries({
    queries: nationalIds.map((id) =>
      trpc.company.list.queryOptions({ q: id, page: 1, pageSize: 5 }),
    ),
  })

  const remove = useMutation({
    ...trpc.config.updateByKey.mutationOptions(),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: trpc.config.getByKey.queryKey({
            key: MAILBOX_ALLOWLIST_CONFIG_KEY,
          }),
        }),
        queryClient.invalidateQueries({
          queryKey: trpc.config.getHistoryByKey.queryKey({
            key: MAILBOX_ALLOWLIST_CONFIG_KEY,
          }),
        }),
      ])
      toast.success(t.removeSuccess)
    },
    onError: (error) => {
      const translated = error.data?.translatedMessage
      toast.error(
        translated ? `${t.removeError} - ${translated}` : t.removeError,
        { autoClose: 5000 },
      )
    },
  })

  const removeId = (id: string) => {
    const rest = nationalIds.filter((other) => other !== id)
    // Built from the list this page read, so the API refuses it if someone
    // has changed the setting since (a stale remove would re-add a company
    // they just removed).
    remove.mutate({
      key: MAILBOX_ALLOWLIST_CONFIG_KEY,
      value: rest.length ? rest.join(',') : 'none',
      expectedValue: storedValue,
    })
  }

  return (
    <Box background="white" borderRadius="large" padding={[3, 3, 4]}>
      <Stack space={2}>
        <Text variant="h4" fontWeight="semiBold">
          {t.selectedHeading}
        </Text>
        <Box>
          {nationalIds.map((id, index) => {
            const lookup = lookups[index]
            const company = lookup?.data?.companies.find(
              (c) => c.nationalId.replace(/\D/g, '') === id,
            )
            const name = lookup?.isPending
              ? '…'
              : (company?.name ?? t.unknownCompany)
            return (
              <Box
                key={id}
                background={index % 2 === 0 ? 'white' : 'blue100'}
                padding={1}
              >
                <GridRow alignItems="center">
                  <GridColumn span={['12/12', '6/12']}>
                    <Text fontWeight="semiBold">{name}</Text>
                  </GridColumn>
                  <GridColumn span={['8/12', '3/12']}>
                    <Text>{formatNationalId(id)}</Text>
                  </GridColumn>
                  <GridColumn span={['4/12', '3/12']}>
                    <Box display="flex" justifyContent="flexEnd">
                      <Button
                        size="small"
                        variant="text"
                        colorScheme="destructive"
                        icon="trash"
                        iconType="outline"
                        disabled={remove.isPending}
                        onClick={() => removeId(id)}
                      >
                        {t.removeButton}
                      </Button>
                    </Box>
                  </GridColumn>
                </GridRow>
              </Box>
            )
          })}
        </Box>
      </Stack>
    </Box>
  )
}
