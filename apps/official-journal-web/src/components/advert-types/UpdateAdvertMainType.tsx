import { useEffect, useState } from 'react'
import slugify from 'slugify'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Icon } from '@dmr.is/ui/components/island-is/Icon'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Input } from '@dmr.is/ui/components/island-is/Input'
import { Select } from '@dmr.is/ui/components/island-is/Select'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Tag } from '@dmr.is/ui/components/island-is/Tag'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'

import { AdvertMainType } from '../../gen/fetch'
import { useTRPC } from '../../lib/trpc/client/trpc'

import { useMutation, useQueryClient } from '@tanstack/react-query'

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

  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const { data: mainTypeData } = useQuery(
    trpc.getMainType.queryOptions(
      { id: mainType?.id ?? '' },
      { enabled: !!mainType?.id },
    ),
  )

  const { data: typesData } = useQuery(
    trpc.getTypes.queryOptions({
      department: mainType?.department.id,
      pageSize: 1000,
      unassigned: true,
    }),
  )

  const invalidateAll = () => {
    queryClient.invalidateQueries(trpc.getMainType.queryFilter())
    queryClient.invalidateQueries(trpc.getTypes.queryFilter())
  }

  const updateMainTypeMutation = useMutation(
    trpc.updateMainType.mutationOptions({
      onSuccess: (data) => {
        toast.success(`Tegund ${data.mainType.title} uppfærður`)
        invalidateAll()
        refetch && refetch()
      },
    }),
  )

  const deleteMainTypeMutation = useMutation(
    trpc.deleteMainType.mutationOptions({
      onSuccess: () => {
        toast.success(`Tegund ${mainType?.title} eytt`)
        invalidateAll()
        onDeleteSuccess && onDeleteSuccess()
        refetch && refetch()
      },
    }),
  )

  const updateTypeMutation = useMutation(
    trpc.updateType.mutationOptions({
      onSuccess: (data) => {
        toast.success(`Yfirheiti ${data.type.title} uppfært`)
        invalidateAll()
        refetch && refetch()
      },
    }),
  )

  const currentMainType = mainTypeData?.mainType
  const types = typesData?.types

  const mainTypeTypes = currentMainType
    ? currentMainType?.types.map((type) => type)
    : (mainType?.types.map((type) => type) ?? [])

  const typeOptions = types?.map((type) => ({
    label: type.title,
    value: type,
  }))

  const [updateState, setUpdateState] = useState({
    title: mainType?.title ?? '',
  })

  const hasEditedTitle = mainType?.title !== updateState.title

  if (!mainType) {
    return (
      <AlertMessage
        type="info"
        title="Enginn tegund valinn"
        message="Veldu tegund til þess að uppfæra eða breyta"
      />
    )
  }

  return (
    <Stack space={[2, 2, 3]}>
      {updateTypeMutation.error && (
        <AlertMessage
          type="error"
          title="Villa"
          message={updateTypeMutation.error.message}
        />
      )}
      {deleteMainTypeMutation.error && (
        <AlertMessage
          type="error"
          title="Villa"
          message={deleteMainTypeMutation.error.message}
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
        label="Heiti tegundar"
        backgroundColor="blue"
      />
      <Input
        readOnly
        name="update-main-type-slug"
        value={
          hasEditedTitle
            ? slugify(
                `${mainType.department.title}-${updateState.title}`,
                {
                  lower: true,
                },
              )
            : mainType.slug
        }
        size="sm"
        label={
          !hasEditedTitle ? 'Slóð tegundar' : 'Uppfærð slóð tegundar'
        }
        backgroundColor="blue"
      />
      <Inline space={[2, 2, 3]} justifyContent="spaceBetween" flexWrap="wrap">
        <Button
          colorScheme="destructive"
          size="small"
          variant="ghost"
          icon="trash"
          iconType="outline"
          onClick={() => deleteMainTypeMutation.mutate({ id: mainType.id })}
        >
          Eyða tegund
        </Button>
        <Button
          size="small"
          variant="ghost"
          icon="pencil"
          iconType="outline"
          onClick={() =>
            updateMainTypeMutation.mutate({
              id: mainType.id,
              title: updateState.title,
            })
          }
        >
          Uppfæra heiti
        </Button>
      </Inline>
      {mainTypeTypes.length === 0 ? (
        <Text variant="h5">Ekkert yfirheiti í þessari tegund</Text>
      ) : (
        <>
          <Text variant="h5">{`Tegundir tengdar við ${
            currentMainType?.title ?? mainType.title
          }`}</Text>
          <Inline space={[2, 2, 3]} flexWrap="wrap">
            {mainTypeTypes.map((type) => (
              <Tag
                onClick={() =>
                  updateTypeMutation.mutate({
                    id: type.id,
                    mainTypeId: mainType.id,
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
        label="Yfirheiti"
        options={typeOptions}
        placeholder="Bæta yfirheiti við tegund"
        noOptionsMessage={`Ekkert yfirheiti í ${mainType.department.title}`}
        onChange={(opt) => {
          if (opt) {
            updateTypeMutation.mutate({
              mainTypeId: mainType.id,
              id: opt.value.id,
            })
          }
        }}
      />
    </Stack>
  )
}
