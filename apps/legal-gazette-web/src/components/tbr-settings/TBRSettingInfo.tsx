'use client'
import { useCallback } from 'react'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Input } from '@dmr.is/ui/components/island-is/Input'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'
import { formatDate } from '@dmr.is/utils-shared/format/date'
import { debounce } from '@dmr.is/utils-shared/lodash/debounce'

import {
  TBRCompanySettingsItemDto,
  TBRCompanySettingsListDto,
} from '../../gen/fetch'
import { useTRPC } from '../../lib/trpc/client/trpc'

import { useMutation, useQueryClient } from '@tanstack/react-query'

type Props = {
  setting: TBRCompanySettingsItemDto
}

export const TBRSettingInfo = ({ setting }: Props) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const { mutate } = useMutation(
    trpc.updateTbrSetting.mutationOptions({
      onMutate: async (variables) => {
        await queryClient.cancelQueries(trpc.getTbrSettings.queryFilter())

        const prevData = queryClient.getQueryData<TBRCompanySettingsListDto>(
          trpc.getTbrSettings.queryKey(),
        )

        if (!prevData) return

        const optimisticData = {
          ...prevData,
          items: prevData.items.map((item) =>
            item.id === variables.id ? { ...item, ...variables } : item,
          ),
        }

        queryClient.setQueryData(trpc.getTbrSettings.queryKey(), optimisticData)

        return prevData
      },
      onSuccess: async () => {
        toast.success('Stilling uppfærð successfully', {
          toastId: 'update-tbr-setting-success',
        })

        // await queryClient.invalidateQueries(trpc.getTbrSettings.queryFilter())
      },
      onError: async (_error, _variables, onMutateResults) => {
        toast.error('Villa við að uppfæra stillingu', {
          toastId: 'update-tbr-setting-error',
        })

        if (onMutateResults) {
          queryClient.setQueryData(
            trpc.getTbrSettings.queryKey(),
            onMutateResults,
          )
        }
      },
    }),
  )

  const handleUpdate = useCallback(
    debounce((field: string, value: string) => {
      mutate({
        id: setting.id,
        [field]: value,
      })
    }, 300),
    [mutate, setting.id],
  )

  const onUpdate = (field: string, value: string) => {
    handleUpdate.cancel()
    handleUpdate(field, value)
  }

  return (
    <Box padding={[2, 3]}>
      <GridContainer>
        <GridRow rowGap={[2, 3]}>
          <GridColumn span={['12/12', '3/12']}>
            <Input
              name="id"
              label="Auðkenni"
              value={setting.id}
              readOnly
              size="sm"
            />
          </GridColumn>
          <GridColumn span={['12/12', '3/12']}>
            <Input
              name="created-at"
              label="Stofnað þann"
              value={formatDate(setting.createdAt)}
              readOnly
              size="sm"
            />
          </GridColumn>
          <GridColumn span={['12/12', '3/12']}>
            <Input
              name="updated-at"
              label="Síðast uppfært þann"
              value={formatDate(setting.updatedAt)}
              readOnly
              size="sm"
            />
          </GridColumn>
          <GridColumn span={['12/12', '3/12']}>
            <Input
              name="code"
              label="Kóði"
              value={setting.code}
              readOnly
              size="sm"
            />
          </GridColumn>
          <GridColumn span={['12/12', '3/12']}>
            <Input
              name="name"
              backgroundColor="blue"
              label="Nafn"
              defaultValue={setting.name}
              size="sm"
              onChange={(e) => onUpdate('name', e.target.value)}
            />
          </GridColumn>
          <GridColumn span={['12/12', '3/12']}>
            <Input
              name="ssn"
              backgroundColor="blue"
              label="Kennitala"
              defaultValue={setting.nationalId}
              size="sm"
              onChange={(e) => onUpdate('nationalId', e.target.value)}
            />
          </GridColumn>
          <GridColumn span={['12/12', '3/12']}>
            <Input
              name="email"
              backgroundColor="blue"
              label="Netfang"
              defaultValue={setting.email}
              size="sm"
              onChange={(e) => onUpdate('email', e.target.value)}
            />
          </GridColumn>
          <GridColumn span={['12/12', '3/12']}>
            <Input
              name="phone"
              backgroundColor="blue"
              label="Sími"
              defaultValue={setting.phone}
              size="sm"
              onChange={(e) => onUpdate('phone', e.target.value)}
            />
          </GridColumn>
        </GridRow>
      </GridContainer>
    </Box>
  )
}
