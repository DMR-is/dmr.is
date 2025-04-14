import { useState } from 'react'

import { Button, Inline, Input, Stack, toast } from '@island.is/island-ui/core'

import { useAdvertTypes, useDepartments } from '../../hooks/api'
import { useMainTypes } from '../../hooks/api/useMainTypes'
import { OJOISelect } from '../select/OJOISelect'

type Props = {
  refetch?: () => void
}

export const CreateType = ({ refetch }: Props) => {
  const [state, setState] = useState({
    mainTypeId: '',
    departmentId: '',
    title: '',
  })

  const { departments } = useDepartments()

  const { mainTypes } = useMainTypes({
    mainTypesParams: {
      department: state.departmentId,
    },
  })

  const { createType, isCreatingType } = useAdvertTypes({
    onCreateTypeSuccess: ({ type }) => {
      toast.success(`Yfirheiti ${type.title} stofnað`)
      refetch && refetch()
      setState({
        mainTypeId: '',
        departmentId: '',
        title: '',
      })
    },
  })

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
          loading={isCreatingType}
          onClick={() => createType(state)}
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
