import { useState } from 'react'

import {
  AlertMessage,
  Button,
  Inline,
  Input,
  Select,
  Stack,
  toast,
} from '@island.is/island-ui/core'

import { useAdvertTypes, useDepartments } from '../../hooks/api'

type Props = {
  refetch?: () => void
}

export const CreateType = ({ refetch }: Props) => {
  const { departments } = useDepartments()
  const { createType, createTypeError, isCreatingType } = useAdvertTypes({
    onCreateTypeSuccess: ({ type }) => {
      toast.success(`Tegund ${type.title} stofnuð`)
      refetch && refetch()
      setState({
        departmentId: '',
        title: '',
      })
    },
  })

  const departmentOptions = departments?.map((dep) => ({
    label: dep.title,
    value: dep,
  }))

  const [state, setState] = useState({
    departmentId: '',
    title: '',
  })

  const isDisabled = !state.departmentId || !state.title

  return (
    <Stack space={[2, 2, 3]}>
      {createTypeError && (
        <AlertMessage
          type={createTypeError.type}
          title={createTypeError.name}
          message={createTypeError.message}
        />
      )}
      <Select
        isClearable
        size="sm"
        backgroundColor="blue"
        label="Veldu deild tegundar"
        options={departmentOptions}
        placeholder="Veldu deild"
        onChange={(option) =>
          setState({
            ...state,
            departmentId: option?.value.id ?? '',
          })
        }
      />
      <Input
        name="create-type-title"
        size="sm"
        backgroundColor="blue"
        placeholder='T.d. "Reglur"'
        label="Heiti tegundar"
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
          Stofna tegund
        </Button>
      </Inline>
    </Stack>
  )
}
