import { useState } from 'react'
import slugify from 'slugify'

import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Input } from '@dmr.is/ui/components/island-is/Input'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'

import { Department, GetAdvertMainType } from '../../gen/fetch'
import { useDepartments } from '../../hooks/api'
import { useMainTypes } from '../../hooks/api/useMainTypes'
import { OJOISelect } from '../select/OJOISelect'

type CreateMainTypeState = {
  department: Department | null
  title: string
  slug: string
}

type Props = {
  onSuccess?: (data: GetAdvertMainType) => void
}

export const CreateMainType = ({ onSuccess }: Props) => {
  const { departments } = useDepartments()

  const { createMainType, createMainTypeError, isCreatingMainType } =
    useMainTypes({
      onCreateMainTypeSuccess: (data) => {
        onSuccess && onSuccess(data)

        setState({
          department: null,
          title: '',
          slug: '',
        })
      },
    })

  const departmentOptions = departments?.map((dep) => ({
    label: dep.title,
    value: dep,
  }))

  const [state, setState] = useState<CreateMainTypeState>({
    department: null,
    title: '',
    slug: '',
  })

  const canCreate = state.department && state.title

  return (
    <Stack space={[2, 2, 3]}>
      {createMainTypeError && (
        <AlertMessage
          title={createMainTypeError.name}
          type={createMainTypeError.type}
          message={createMainTypeError.message}
        />
      )}
      <OJOISelect
        key={state.department?.id}
        isClearable
        name="create-main-type-department"
        label="Veldu deild"
        options={departmentOptions}
        placeholder="Veldu deild tegundar"
        value={departmentOptions?.find(
          (dep) => state?.department?.id === dep.value.id,
        )}
        onChange={(opt) => {
          if (!opt) {
            setState({
              department: null,
              title: '',
              slug: '',
            })
          } else {
            setState({
              department: opt.value,
              title: state.title,
              slug: slugify(`${opt.value.title}-${state.title}`, {
                lower: true,
              }),
            })
          }
        }}
      />
      <Input
        size="sm"
        disabled={!state.department}
        backgroundColor="blue"
        name="create-main-type-title"
        label="Heiti tegundar"
        placeholder='T.d. "Lög" eða "Reglugerðir"'
        value={state.title}
        onChange={(e) => {
          setState({
            ...state,
            title: e.target.value,
            slug: slugify(
              `${state.department ? `${state.department.title}-` : ''}${
                e.target.value
              }`,
              {
                lower: true,
              },
            ),
          })
        }}
      />
      <Input
        name="create-main-type-slug"
        size="sm"
        backgroundColor="blue"
        readOnly
        label="Slóð tegundar"
        value={state.slug}
      />
      <Inline space={[2, 2, 3]} justifyContent="flexEnd">
        <Button
          loading={isCreatingMainType}
          onClick={() => {
            if (!state.department) {
              return
            }
            createMainType({
              departmentId: state.department.id,
              title: state.title,
            })
          }}
          disabled={!canCreate}
          size="small"
          variant="ghost"
          icon="add"
        >
          Stofna tegund
        </Button>
      </Inline>
    </Stack>
  )
}
