import slugify from 'slugify'

import { Button, Inline, Input, Stack } from '@island.is/island-ui/core'

import { Institution } from '../../gen/fetch'

type Props = {
  institution: Institution
  isDeleting: boolean
  isUpdating: boolean
  onChange: (institution: Institution) => void
  onUpdate: (institution: Institution) => void
  onDelete: (institution: Institution) => void
}

export const UpdateInstitution = ({
  institution,
  isDeleting,
  isUpdating,
  onChange,
  onUpdate,
  onDelete,
}: Props) => {
  const isDisabled = !institution.id

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
        value={institution.title}
        onChange={(e) => onChange({ ...institution, title: e.target.value })}
      />
      <Input
        name="update-institution-slug"
        size="sm"
        type="text"
        label="Slóð stofnunar"
        placeholder="Sláðu inn heiti stofnunar"
        backgroundColor="blue"
        readOnly
        value={slugify(institution.title, { lower: true })}
      />
      <Inline space={2} justifyContent="spaceBetween" flexWrap="wrap">
        <Button
          disabled={isDisabled}
          icon="trash"
          iconType="outline"
          loading={isDeleting}
          onClick={() => onDelete(institution)}
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
          loading={isUpdating}
          onClick={() => onUpdate(institution)}
          size="small"
          variant="ghost"
        >
          Breyta stofnun
        </Button>
      </Inline>
    </Stack>
  )
}
