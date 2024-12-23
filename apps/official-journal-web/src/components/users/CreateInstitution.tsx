import { useState } from 'react'
import slugify from 'slugify'

import { Button, Inline, Input, Stack, toast } from '@island.is/island-ui/core'

import { CreateInstitution as CreateInstitutionDto } from '../../gen/fetch'
import { useInstitutions } from '../../hooks/api'

type Props = {
  onCreateSuccess: () => void
}

export const CreateInstitution = ({ onCreateSuccess }: Props) => {
  const [createState, setCreateState] = useState<CreateInstitutionDto>({
    title: '',
  })

  const { createInstitution, isCreatingInstitution } = useInstitutions({
    onCreateSuccess: () => {
      toast.success(`Stofnun ${createState.title} hefur verið stofnuð`)
      setCreateState({
        title: '',
      })
      onCreateSuccess && onCreateSuccess()
    },
  })
  return (
    <Stack space={[2, 2, 3]}>
      <Input
        name="create-institution-title"
        size="sm"
        type="text"
        label="Titill stofnunar"
        placeholder="Sláðu inn heiti stofnunar"
        backgroundColor="blue"
        value={createState.title}
        onChange={(e) =>
          setCreateState({
            title: e.target.value,
          })
        }
      />
      <Input
        name="create-institution-slug"
        size="sm"
        type="text"
        label="Slóð stofnunar"
        backgroundColor="blue"
        value={slugify(createState.title, { lower: true })}
        readOnly
      />
      <Inline space={2} justifyContent="flexEnd">
        <Button
          icon="business"
          iconType="outline"
          loading={isCreatingInstitution}
          disabled={!createState.title}
          size="small"
          variant="primary"
          onClick={() =>
            createInstitution({
              title: createState.title,
            })
          }
        >
          Stofna stofnun
        </Button>
      </Inline>
    </Stack>
  )
}
