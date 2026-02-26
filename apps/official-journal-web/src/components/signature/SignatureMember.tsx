import debounce from 'lodash/debounce'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Column } from '@dmr.is/ui/components/island-is/Column'
import { Columns } from '@dmr.is/ui/components/island-is/Columns'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'

import { SignatureMember as SignatureMemberDto } from '../../gen/fetch'
import { useCaseContext } from '../../hooks/useCaseContext'
import { OJOIInput } from '../select/OJOIInput'

type Props = SignatureMemberDto & {
  onChange: (key: keyof SignatureMemberDto, val: string) => void
  isUpdating?: boolean
  onDelete?: () => void
  isDeleting?: boolean
}

export const SignatureMember = ({
  name,
  textAbove,
  textAfter,
  textBelow,
  onChange,
  onDelete,
  isUpdating,
  isDeleting,
}: Props) => {
  const debouncedChange = debounce(onChange, 500)

  const { canEdit } = useCaseContext()

  return (
    <Stack space={2}>
      <Columns space={2}>
        <Column>
          <OJOIInput
            isValidating={isUpdating}
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
            isValidating={isUpdating}
            disabled={!canEdit}
            label="Nafn"
            name="signature-member-name"
            defaultValue={name}
            onChange={(e) => debouncedChange('name', e.target.value)}
          />
        </Column>
        <Column>
          <OJOIInput
            isValidating={isUpdating}
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
            isValidating={isUpdating}
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
              loading={isDeleting}
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
