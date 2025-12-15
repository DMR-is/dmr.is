'use client'
import { useEffect, useState } from 'react'

import {
  Button,
  GridColumn,
  GridContainer,
  GridRow,
  Input,
  Text,
  toast,
} from '@dmr.is/ui/components/island-is'
import { Modal } from '@dmr.is/ui/components/Modal/Modal'

import { TBRCompanySettingsListDto } from '../../gen/fetch'
import { useTRPC } from '../../lib/trpc/client/trpc'

import { useMutation, useQueryClient } from '@tanstack/react-query'

type Props = {
  visible?: boolean
}

export const CreateTBRSetting = ({ visible: initalVis = false }: Props) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const { mutate, isPending } = useMutation(
    trpc.createTbrSetting.mutationOptions({
      onMutate: async (variables) => {
        await queryClient.cancelQueries(trpc.getTbrSettings.queryFilter())

        const prevData = queryClient.getQueryData<TBRCompanySettingsListDto>(
          trpc.getTbrSettings.queryKey(),
        )

        if (!prevData) return

        const isoNow = new Date().toISOString()

        const optimisticData: TBRCompanySettingsListDto = {
          ...prevData,
          items: [
            ...prevData.items,
            {
              ...variables,
              id: 'temp-id',
              createdAt: isoNow,
              updatedAt: isoNow,
              deletedAt: undefined,
              code: 'XX',
              active: true,
            },
          ],
        }

        queryClient.setQueryData(trpc.getTbrSettings.queryKey(), optimisticData)

        return prevData
      },

      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.getTbrSettings.queryFilter())
        toast.success(`${state.name} stilling búin til successfully`, {
          toastId: 'create-tbr-setting-success',
        })

        setState({
          name: '',
          nationalId: '',
          email: '',
          phone: '',
        })

        setVisible(false)
      },

      onError: async (_error, _variables, onMutateResults) => {
        toast.error('Villa við að búa til TBR stillingu', {
          toastId: 'create-tbr-setting-error',
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

  const [state, setState] = useState({
    name: '',
    nationalId: '',
    email: '',
    phone: '',
  })

  const [visible, setVisible] = useState(initalVis)

  useEffect(() => {
    setVisible(initalVis)
  }, [initalVis])

  const onChange = (field: keyof typeof state, value: string | boolean) => {
    setState((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  return (
    <Modal
      baseId="create-tbr-setting"
      isVisible={visible}
      disclosure={
        <Button
          circle
          size="small"
          icon="add"
          iconType="outline"
          onClick={() => setVisible(true)}
        />
      }
    >
      <GridContainer>
        <GridRow rowGap={[2, 3]}>
          <GridColumn span="12/12">
            <Text variant="h3">Skrá fyrirtæki í reikningsviðskipti</Text>
          </GridColumn>
          <GridColumn span={['12/12', '6/12']}>
            <Input
              size="sm"
              required
              name="name"
              label="Nafn fyrirtækis"
              value={state.name}
              onChange={(e) => onChange('name', e.target.value)}
            />
          </GridColumn>
          <GridColumn span={['12/12', '6/12']}>
            <Input
              size="sm"
              required
              name="nationalId"
              label="Kennitala fyrirtækis"
              value={state.nationalId}
              onChange={(e) => onChange('nationalId', e.target.value)}
            />
          </GridColumn>
          <GridColumn span={['12/12', '6/12']}>
            <Input
              size="sm"
              name="email"
              label="Netfang tengiliðs"
              value={state.email}
              onChange={(e) => onChange('email', e.target.value)}
            />
          </GridColumn>
          <GridColumn span={['12/12', '6/12']}>
            <Input
              size="sm"
              name="phone"
              label="Símanúmer tengiliðs"
              value={state.phone}
              onChange={(e) => onChange('phone', e.target.value)}
            />
          </GridColumn>
          <GridColumn span="12/12">
            <Button
              variant="primary"
              size="small"
              icon="add"
              loading={isPending}
              iconType="outline"
              onClick={() => mutate(state)}
            >
              Bæta við
            </Button>
          </GridColumn>
        </GridRow>
      </GridContainer>
    </Modal>
  )
}
