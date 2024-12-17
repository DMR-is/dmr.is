import { useEffect, useState } from 'react'
import slugify from 'slugify'

import {
  AlertMessage,
  Box,
  Button,
  Icon,
  Inline,
  Input,
  Select,
  Stack,
  Tag,
  Text,
  toast,
} from '@island.is/island-ui/core'

import { AdvertMainType } from '../../gen/fetch'
import { useAdvertTypes } from '../../hooks/api'

type Props = {
  mainType?: AdvertMainType | null
  refetch?: () => void
  onDeleteSuccess?: () => void
}

export const UpdateAdvertMainType = ({
  mainType,
  refetch,
  onDeleteSuccess,
}: Props) => {
  useEffect(() => {
    if (mainType) {
      setUpdateState({
        title: mainType.title,
      })
    }
  }, [mainType])

  const {
    types,
    refetchTypes,
    updateType,
    updateMainType,
    deleteMainType,
    mainType: currentMainType,
    refetchMainType,
    updateTypeError,
    deleteTypeError,
  } = useAdvertTypes({
    typesParams: {
      department: mainType?.department.id,
      unassigned: true,
    },
    mainTypeId: mainType?.id,
    onUpdateMainTypeSuccess: ({ mainType }) => {
      toast.success(`Yfirflokkur ${mainType.title} uppfærður`)
      refetchMainType()
      refetchTypes()
      refetch && refetch()
    },
    onUpdateTypeSuccess: ({ type }) => {
      toast.success(`Tegund ${type.title} uppfærð`)
      refetchMainType()
      refetchTypes()
      refetch && refetch()
    },
    onDeleteMainTypeSuccess: () => {
      toast.success(`Yfirflokkur ${mainType?.title} eytt`)
      refetchMainType()
      refetchTypes()
      onDeleteSuccess && onDeleteSuccess()
      refetch && refetch()
    },
  })

  const mainTypeTypes = currentMainType
    ? currentMainType?.types.map((type) => type)
    : mainType?.types.map((type) => type) ?? []

  const typeOptions = types?.map((type) => ({
    label: type.title,
    value: type,
  }))

  const [updateState, setUpdateState] = useState({
    title: mainType?.title ?? '',
  })

  if (!mainType) {
    return (
      <AlertMessage
        type="info"
        title="Enginn yfirflokkur valinn"
        message="Veldu yfirflokk til þess að uppfæra eða breyta"
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
        name="update-main-type-title"
        value={updateState.title}
        onChange={(e) =>
          setUpdateState({
            title: e.target.value,
          })
        }
        size="sm"
        label="Heiti yfirflokks"
        backgroundColor="blue"
      />
      <Input
        readOnly
        name="update-main-type-slug"
        value={slugify(`${mainType.department.title}-${updateState.title}`, {
          lower: true,
        })}
        size="sm"
        label="Slóð yfirflokks"
        backgroundColor="blue"
      />
      <Inline space={[2, 2, 3]} justifyContent="spaceBetween" flexWrap="wrap">
        <Button
          colorScheme="destructive"
          size="small"
          variant="ghost"
          icon="trash"
          iconType="outline"
          onClick={() => deleteMainType({ id: mainType.id })}
        >
          Eyða yfirflokk
        </Button>
        <Button
          size="small"
          variant="ghost"
          icon="pencil"
          iconType="outline"
          onClick={() =>
            updateMainType({ id: mainType.id, title: updateState.title })
          }
        >
          Uppfæra heiti
        </Button>
      </Inline>
      {mainTypeTypes.length === 0 ? (
        <Text variant="h5">Engin tegund í þessum yfirflokk</Text>
      ) : (
        <>
          <Text variant="h5">{`Tegundir tengdar við ${
            currentMainType?.title ?? mainType.title
          }`}</Text>
          <Inline space={[2, 2, 3]}>
            {mainTypeTypes.map((type) => (
              <Tag
                onClick={() =>
                  updateType({
                    id: mainType.id,
                    mainTypeId: null,
                  })
                }
                variant="blueberry"
              >
                <Box display="flex" columnGap="smallGutter" alignItems="center">
                  <span>{type.title}</span>
                  <Icon icon="close" size="small" />
                </Box>
              </Tag>
            ))}
          </Inline>
        </>
      )}
      <Select
        isClearable
        size="sm"
        backgroundColor="blue"
        label="Tegundir"
        options={typeOptions}
        placeholder="Bæta tegund við yfirflokk"
        noOptionsMessage={`Engin tegund í ${mainType.department.title}`}
        onChange={(opt) => {
          if (opt) {
            updateType({
              mainTypeId: mainType.id,
              id: opt.value.id,
            })
          }
        }}
      />
    </Stack>
  )
}
