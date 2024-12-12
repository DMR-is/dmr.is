import { Button, Inline, Input, Stack } from '@island.is/island-ui/core'

import { CreateInstitution as CreateInstitutionDto } from '../../gen/fetch'

type Props = {
  institution: CreateInstitutionDto
  isCreating: boolean
  onUpdate: (institution: CreateInstitutionDto) => void
  onCreate: (institution: CreateInstitutionDto) => void
}

export const CreateInstitution = ({
  institution,
  isCreating,
  onCreate,
  onUpdate,
}: Props) => {
  return (
    <Stack space={[2, 2, 3]}>
      <Input
        name="create-institution-title"
        size="sm"
        type="text"
        label="Titill stofnunar"
        placeholder="Sláðu inn heiti stofnunar"
        backgroundColor="blue"
        value={institution.title}
        onChange={(e) =>
          onUpdate({
            ...institution,
            title: e.target.value,
          })
        }
      />
      <Inline space={2} justifyContent="flexEnd">
        <Button
          icon="business"
          iconType="outline"
          loading={isCreating}
          disabled={!institution.title}
          size="small"
          variant="primary"
          onClick={() => onCreate(institution)}
        >
          Stofna stofnun
        </Button>
      </Inline>
    </Stack>
  )
}
