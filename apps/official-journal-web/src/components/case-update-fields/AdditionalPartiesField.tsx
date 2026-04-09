import { useState } from 'react'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import { AccordionItem } from '@dmr.is/ui/components/island-is/AccordionItem'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'
import { DataTable } from '@dmr.is/ui/components/Tables/DataTable'

import { useCaseContext } from '../../hooks/useCaseContext'
import { useTRPC } from '../../lib/trpc/client/trpc'
import { createOptions } from '../../lib/utils'
import { OJOISelect } from '../select/OJOISelect'

import { useMutation } from '@tanstack/react-query'

type Props = {
  toggle: boolean
  onToggle: () => void
}

export const AdditionalPartiesField = ({ toggle, onToggle }: Props) => {
  const { currentCase, refetch } = useCaseContext()
  const trpc = useTRPC()

  const { data: institutionsData, isLoading: isLoadingInstitutions } = useQuery(
    {
      ...trpc.getInstitutions.queryOptions({
        page: 1,
        pageSize: 1000,
      }),
      refetchOnWindowFocus: false,
    },
  )

  const existingPartyIds = new Set([
    currentCase.involvedParty.id,
    ...currentCase.additionalParties.map((p) => p.id),
  ])

  const institutionOptions = createOptions(
    (institutionsData?.institutions ?? []).filter(
      (inst) => !existingPartyIds.has(inst.id),
    ),
  )

  const addParty = useMutation(
    trpc.addAdditionalParty.mutationOptions({
      onSuccess: () => {
        refetch()
        toast.success('Aðila bætt við')
      },
      onError: () => {
        toast.error('Ekki tókst að bæta við aðila')
      },
    }),
  )

  const deleteParty = useMutation(
    trpc.deleteAdditionalParty.mutationOptions({
      onSuccess: () => {
        refetch()
        toast.success('Aðili fjarlægður')
      },
      onError: () => {
        toast.error('Ekki tókst að fjarlægja aðila')
      },
    }),
  )

  return (
    <AccordionItem
      id="additional-parties-fields"
      expanded={toggle}
      onToggle={onToggle}
      label="Aðrir aðilar"
      labelVariant="h5"
      iconVariant="small"
    >
      <Stack space={3}>
        <DataTable
          noDataMessage="Engir aðrir aðilar skráðir"
          columns={[
            {
              field: 'title',
              children: 'Heiti stofnunar',
            },
            {
              field: 'nationalId',
              children: 'Kennitala',
            },
            {
              field: 'delete',
              children: '',
              width: '50px',
            },
          ]}
          rows={currentCase.additionalParties.map((party) => ({
            title: party.title,
            nationalId: party.nationalId,
            delete: (
              <Button
                variant="utility"
                size="small"
                icon="trash"
                iconType="outline"
                onClick={() =>
                  deleteParty.mutate({
                    caseId: currentCase.id,
                    involvedPartyId: party.id,
                  })
                }
              />
            ),
          }))}
        />
        <Box>
          <Stack space={2}>
            <Text variant="medium" fontWeight="semiBold">
              Bæta við aðila
            </Text>
            <OJOISelect
              width="half"
              filterConfig={{ matchFrom: 'any' }}
              name="add-additional-party"
              label="Leita að stofnun"
              placeholder="Sláðu inn heiti stofnunar"
              isLoading={isLoadingInstitutions}
              options={institutionOptions}
              onChange={(opt) => {
                if (!opt) return
                addParty.mutate({
                  caseId: currentCase.id,
                  involvedPartyId: opt.value,
                })
              }}
            />
          </Stack>
        </Box>
      </Stack>
    </AccordionItem>
  )
}
