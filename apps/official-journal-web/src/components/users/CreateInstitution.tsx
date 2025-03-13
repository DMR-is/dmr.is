import { useState } from 'react'
import slugify from 'slugify'

import {
  Button,
  Inline,
  Input,
  Stack,
  Text,
  toast,
} from '@island.is/island-ui/core'

import { CreateInstitution as CreateInstitutionDto } from '../../gen/fetch'
import { useInstitutions } from '../../hooks/api'

export const CreateInstitution = () => {
  const [createState, setCreateState] = useState<CreateInstitutionDto>({
    title: '',
    nationalId: '',
  })

  const { createInstitution, isCreatingInstitution } = useInstitutions({
    onCreateSuccess: () => {
      toast.success(`Stofnun ${createState.title} hefur verið stofnuð`)
      setCreateState({
        title: '',
        nationalId: '',
      })
    },
  })
  return (
    <Stack space={[2, 2, 3]}>
      <Text variant="h3">Ný stofnun</Text>
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
            ...createState,
            title: e.target.value,
          })
        }
      />
      <Input
        name="create-institution-national-id"
        size="sm"
        type="text"
        label="Kennitala stofnunar"
        placeholder="Sláðu inn kennitölu stofnunar"
        backgroundColor="blue"
        value={createState.nationalId}
        onChange={(e) =>
          setCreateState({
            ...createState,
            nationalId: e.target.value,
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
          onClick={() => createInstitution(createState)}
        >
          Stofna stofnun
        </Button>
      </Inline>
    </Stack>
  )
}
