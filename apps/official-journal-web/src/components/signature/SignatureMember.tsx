import debounce from 'lodash/debounce'

import { Box, Button, Column, Columns, Stack } from '@island.is/island-ui/core'

import { SignatureMember as SignatureMemberDto } from '../../gen/fetch'
import { useCaseContext } from '../../hooks/useCaseContext'
import { OJOIInput } from '../select/OJOIInput'

type Props = SignatureMemberDto & {
  onChange: (key: keyof SignatureMemberDto, val: string) => void
  onDelete?: () => void
}

export const SignatureMember = ({
  name,
  textAbove,
  textAfter,
  textBelow,
  onChange,
  onDelete,
}: Props) => {
  const debouncedChange = debounce(onChange, 500)

  const { canEdit } = useCaseContext()

  return (
    <Stack space={2}>
      <Columns space={2}>
        <Column>
          <OJOIInput
            disabled={!canEdit}
            label="Texti yfir"
            name="signature-member-above"
            defaultValue={textAbove ?? ''}
            onChange={(e) => debouncedChange('textAbove', e.target.value)}
          />
        </Column>
      </Columns>
      <Columns space={2}>
        <Column>
          <OJOIInput
            disabled={!canEdit}
            label="Nafn"
            name="signature-member-name"
            defaultValue={name}
            onChange={(e) => debouncedChange('name', e.target.value)}
          />
        </Column>
        <Column>
          <OJOIInput
            disabled={!canEdit}
            label="Texti eftir"
            name="signature-member-after"
            defaultValue={textAfter ?? ''}
            onChange={(e) => debouncedChange('textAfter', e.target.value)}
          />
        </Column>
      </Columns>
      <Columns space={2}>
        <Column>
          <OJOIInput
            disabled={!canEdit}
            label="Texti undir"
            name="signature-member-below"
            defaultValue={textBelow ?? ''}
            onChange={(e) => debouncedChange('textBelow', e.target.value)}
          />
        </Column>
        <Column>
          <Box
            height="full"
            display="flex"
            alignItems="center"
            justifyContent="flexEnd"
          >
            <Button
              disabled={!onDelete || !canEdit}
              icon="trash"
              variant="utility"
              iconType="outline"
              size="small"
              onClick={() => onDelete && onDelete()}
            >
              Eyða meðlim
            </Button>
          </Box>
        </Column>
      </Columns>
    </Stack>
  )
}
