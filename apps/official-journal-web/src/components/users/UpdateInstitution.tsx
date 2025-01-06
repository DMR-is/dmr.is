import { useEffect, useState } from 'react'
import slugify from 'slugify'

import { Button, Inline, Input, Stack, toast } from '@island.is/island-ui/core'

import { Institution } from '../../gen/fetch'
import { useInstitutions } from '../../hooks/api'

type Props = {
  institution: Institution | null
  onUpdateSuccess?: () => void
  onDeleteSuccess?: () => void
}

export const UpdateInstitution = ({
  institution,
  onDeleteSuccess,
  onUpdateSuccess,
}: Props) => {
  useEffect(() => {
    if (institution) {
      setUpdateState(institution)
    } else {
      setUpdateState({
        id: '',
        title: '',
        slug: '',
      })
    }
  }, [institution])

  const [updateState, setUpdateState] = useState<Institution>({
    id: '',
    title: '',
    slug: '',
  })

  const {
    updateInstitution,
    isUpdatingInstitution,
    deleteInstitution,
    isDeletingInstitution,
  } = useInstitutions({
    onUpdateSuccess: () => {
      toast.success(`Stofnun ${updateState.title} uppfærð`)

      onUpdateSuccess && onUpdateSuccess()
    },
    onDeleteSuccess: () => {
      toast.success(`Stofnun ${updateState.title} eytt`)

      onDeleteSuccess && onDeleteSuccess()
    },
  })

  const isDisabled = !updateState.id

  return (
    <Stack space={[2, 2, 3]}>
      <Input
        disabled={isDisabled}
        name="update-institution-title"
        size="sm"
        type="text"
        label="Titill stofnunar"
        placeholder="Sláðu inn heiti stofnunar"
        backgroundColor="blue"
        value={updateState.title}
        onChange={(e) =>
          setUpdateState({ ...updateState, title: e.target.value })
        }
      />
      <Input
        name="update-institution-slug"
        size="sm"
        type="text"
        label="Slóð stofnunar"
        placeholder="Sláðu inn heiti stofnunar"
        backgroundColor="blue"
        readOnly
        value={slugify(updateState.title, { lower: true })}
      />
      <Inline space={2} justifyContent="spaceBetween" flexWrap="wrap">
        <Button
          disabled={isDisabled}
          icon="trash"
          iconType="outline"
          loading={isDeletingInstitution}
          onClick={() => {
            if (!institution?.id) return
            deleteInstitution({ id: institution.id })
          }}
          size="small"
          variant="ghost"
          colorScheme="destructive"
        >
          Eyða stofnun
        </Button>
        <Button
          disabled={isDisabled}
          icon="pencil"
          iconType="outline"
          loading={isUpdatingInstitution}
          onClick={() => updateInstitution(updateState)}
          size="small"
          variant="ghost"
        >
          Breyta stofnun
        </Button>
      </Inline>
    </Stack>
  )
}
