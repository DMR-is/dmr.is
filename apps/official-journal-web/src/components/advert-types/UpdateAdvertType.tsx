import { useEffect, useState } from 'react'
import slugify from 'slugify'

import { AdvertMainType } from '@dmr.is/shared-dto'
import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Input } from '@dmr.is/ui/components/island-is/Input'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'

import { AdvertType } from '../../gen/fetch'
import { useTRPC } from '../../lib/trpc/client/trpc'

import { useMutation, useQueryClient } from '@tanstack/react-query'

type Props = {
  mainType: AdvertMainType
  type: AdvertType | null
  refetch?: () => void
  onDeleteSuccess?: () => void
}

export const UpdateAdvertType = ({
  mainType,
  type,
  refetch,
  onDeleteSuccess,
}: Props) => {
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

  const hasEditedTitle = state.title !== type?.title

  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const updateTypeMutation = useMutation(
    trpc.updateType.mutationOptions({
      onSuccess: (data) => {
        toast.success(`Yfirheiti ${data.type.title} uppfærð`)
        queryClient.invalidateQueries(trpc.getTypes.queryFilter())
        refetch && refetch()
      },
    }),
  )

  const deleteTypeMutation = useMutation(
    trpc.deleteType.mutationOptions({
      onSuccess: () => {
        toast.success(`Yfirheiti ${type?.title} eytt`)
        queryClient.invalidateQueries(trpc.getTypes.queryFilter())
        setState({ title: '' })
        refetch && refetch()
        onDeleteSuccess && onDeleteSuccess()
      },
    }),
  )

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
      {updateTypeMutation.error && (
        <AlertMessage
          type="error"
          title="Villa"
          message={updateTypeMutation.error.message}
        />
      )}
      {deleteTypeMutation.error && (
        <AlertMessage
          type="error"
          title="Villa"
          message={deleteTypeMutation.error.message}
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
        label={!hasEditedTitle ? 'Slóð yfirheitis' : 'Uppfært slóð yfirheitis'}
        readOnly
        value={
          hasEditedTitle
            ? slugify(`${mainType.slug}-${state.title}`, {
                lower: true,
              })
            : type.slug
        }
        onChange={(e) => setState({ title: e.target.value })}
      />
      <Inline space={[2, 2, 3]} justifyContent="spaceBetween" flexWrap="wrap">
        <Button
          loading={deleteTypeMutation.isPending}
          colorScheme="destructive"
          size="small"
          variant="ghost"
          icon="trash"
          iconType="outline"
          onClick={() => deleteTypeMutation.mutate({ id: type.id })}
        >
          Eyða yfirheiti
        </Button>
        <Button
          loading={updateTypeMutation.isPending}
          size="small"
          variant="ghost"
          icon="pencil"
          iconType="outline"
          onClick={() =>
            updateTypeMutation.mutate({
              id: type.id,
              mainTypeId: mainType.id,
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
