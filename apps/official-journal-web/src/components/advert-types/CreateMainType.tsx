import { useState } from 'react'
import slugify from 'slugify'

import {
  AlertMessage,
  Button,
  Inline,
  Input,
  Stack,
} from '@island.is/island-ui/core'

import { Department, GetAdvertMainType } from '../../gen/fetch'
import { useAdvertTypes, useDepartments } from '../../hooks/api'
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
    useAdvertTypes({
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
        placeholder="Veldu deild yfirflokks"
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
        label="Heiti yfirflokks"
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
        label="Slóð yfirflokks"
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
          Stofna yfirflokk
        </Button>
      </Inline>
    </Stack>
  )
}
