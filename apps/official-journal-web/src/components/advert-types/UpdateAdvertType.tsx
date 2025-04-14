import { useEffect, useState } from 'react'
import slugify from 'slugify'

import {
  AlertMessage,
  Button,
  Inline,
  Input,
  Stack,
  toast,
} from '@island.is/island-ui/core'

import { AdvertType } from '../../gen/fetch'
import { useAdvertTypes } from '../../hooks/api'

type Props = {
  type: AdvertType | null
  refetch?: () => void
  onDeleteSuccess?: () => void
}

export const UpdateAdvertType = ({ type, refetch, onDeleteSuccess }: Props) => {
  useEffect(() => {
    if (type) {
      setState({
        title: type.title,
      })
    }
  }, [type])

  const [state, setState] = useState({
    title: type?.title ?? '',
  })

  const {
    updateType,
    isUpdatingType,
    updateTypeError,
    deleteType,
    isDeletingType,
    deleteTypeError,
  } = useAdvertTypes({
    onUpdateTypeSuccess: ({ type }) => {
      toast.success(`Tegund ${type.title} uppfærð`)
      refetch && refetch()
    },
    onDeleteTypeSuccess: () => {
      toast.success(`Tegund ${type?.title} eytt`)
      setState({ title: '' })
      refetch && refetch()
      onDeleteSuccess && onDeleteSuccess()
    },
  })

  if (!type) {
    return (
      <AlertMessage
        type="info"
        title="Ekkert yfirheiti valið"
        message="Veldu yfirheiti til að uppfæra"
      />
    )
  }

  return (
    <Stack space={[2, 2, 3]}>
      {updateTypeError && (
        <AlertMessage
          type={updateTypeError.type}
          title={updateTypeError.name}
          message={updateTypeError.message}
        />
      )}
      {deleteTypeError && (
        <AlertMessage
          type={deleteTypeError.type}
          title={deleteTypeError.name}
          message={deleteTypeError.message}
        />
      )}
      <Input
        name="update-type-title"
        size="sm"
        backgroundColor="blue"
        label="Heiti"
        value={state.title}
        onChange={(e) => setState({ title: e.target.value })}
      />
      <Input
        name="update-type-slug"
        size="sm"
        backgroundColor="blue"
        label="Slóð yfirheitis"
        readOnly
        value={slugify(`${type.slug}`, {
          lower: true,
        })}
        onChange={(e) => setState({ title: e.target.value })}
      />
      <Inline space={[2, 2, 3]} justifyContent="spaceBetween" flexWrap="wrap">
        <Button
          loading={isDeletingType}
          colorScheme="destructive"
          size="small"
          variant="ghost"
          icon="trash"
          iconType="outline"
          onClick={() => deleteType({ id: type.id })}
        >
          Eyða yfirheiti
        </Button>
        <Button
          loading={isUpdatingType}
          size="small"
          variant="ghost"
          icon="pencil"
          iconType="outline"
          onClick={() =>
            updateType({
              id: type.id,
              title: state.title,
            })
          }
        >
          Uppfæra heiti
        </Button>
      </Inline>
    </Stack>
  )
}
