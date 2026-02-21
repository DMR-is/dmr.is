import { useState } from 'react'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Input } from '@dmr.is/ui/components/island-is/Input'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'

import { useTRPC } from '../../lib/trpc/client/trpc'
import { OJOISelect } from '../select/OJOISelect'

import { useMutation, useQueryClient } from '@tanstack/react-query'

type Props = {
  refetch?: () => void
}

export const CreateType = ({ refetch }: Props) => {
  const [state, setState] = useState({
    mainTypeId: '',
    departmentId: '',
    title: '',
  })

  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const { data: departmentsData } = useQuery(
    trpc.getDepartments.queryOptions({
      pageSize: 100,
    }),
  )

  const { data: mainTypesData } = useQuery(
    trpc.getMainTypes.queryOptions({
      department: state.departmentId || undefined,
    }),
  )

  const createTypeMutation = useMutation(
    trpc.createType.mutationOptions({
      onSuccess: (data) => {
        toast.success(`Yfirheiti ${data.type.title} stofnað`)
        queryClient.invalidateQueries(trpc.getTypes.queryFilter())
        refetch && refetch()
        setState({
          mainTypeId: '',
          departmentId: '',
          title: '',
        })
      },
    }),
  )

  const departments = departmentsData?.departments
  const mainTypes = mainTypesData?.mainTypes

  const departmentOptions = departments?.map((dep) => ({
    label: dep.title,
    value: dep,
  }))

  const mainTypeOptions = mainTypes?.map((main) => ({
    label: main.title,
    value: main,
  }))

  const isDisabled = !state.departmentId || !state.title || !state.mainTypeId

  return (
    <Stack space={[2, 2, 3]}>
      <OJOISelect
        key={state.departmentId}
        isClearable
        label="Veldu deild tegundar"
        options={departmentOptions}
        placeholder="Veldu deild"
        value={departmentOptions?.find(
          (dep) => state.departmentId === dep.value.id,
        )}
        onChange={(option) => {
          if (!option) {
            setState({
              ...state,
              departmentId: '',
              mainTypeId: '',
            })
          } else {
            setState({
              ...state,
              departmentId: option.value.id,
            })
          }
        }}
      />
      <OJOISelect
        isClearable
        label="Veldu tegund"
        options={mainTypeOptions}
        isDisabled={!state.departmentId}
        placeholder="Veldu tegund"
        value={
          mainTypeOptions?.find(
            (maintype) => state.mainTypeId === maintype.value.id,
          ) ?? null
        }
        onChange={(option) => {
          setState({
            ...state,
            mainTypeId: option?.value.id ?? '',
          })
        }}
      />
      <Input
        name="create-type-title"
        size="sm"
        backgroundColor="blue"
        placeholder='T.d. "Reglur"'
        disabled={!state.mainTypeId}
        label="Yfirheiti"
        value={state.title}
        onChange={(e) =>
          setState({
            ...state,
            title: e.target.value,
          })
        }
      />
      <Inline space={[2, 2, 3]} justifyContent="flexEnd">
        <Button
          loading={createTypeMutation.isPending}
          onClick={() => createTypeMutation.mutate(state)}
          disabled={isDisabled}
          size="small"
          variant="ghost"
          icon="add"
          iconType="outline"
        >
          Stofna yfirheiti
        </Button>
      </Inline>
    </Stack>
  )
}
