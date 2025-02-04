import debounce from 'lodash/debounce'

import {
  Box,
  Button,
  Column,
  Columns,
  Inline,
  Stack,
} from '@island.is/island-ui/core'

import { SignatureMember as SignatureMemberDto } from '../../gen/fetch'
import { OJOIInput } from '../select/OJOIInput'

type Props = SignatureMemberDto & {
  onChange: (key: keyof SignatureMemberDto, val: string) => void
  onDelete?: () => void
}

export const SignatureMember = ({
  text,
  textAbove,
  textAfter,
  textBelow,
  onChange,
  onDelete,
}: Props) => {
  const debouncedChange = debounce(onChange, 500)

  return (
    <Stack space={2}>
      <Columns space={2}>
        <Column>
          <OJOIInput
            label="Texti yfir"
            name="signature-member-above"
            defaultValue={textAbove}
            onChange={(e) => debouncedChange('textAbove', e.target.value)}
          />
        </Column>
      </Columns>
      <Columns space={2}>
        <Column>
          <OJOIInput
            label="Nafn"
            name="signature-member-name"
            defaultValue={text}
            onChange={(e) => debouncedChange('text', e.target.value)}
          />
        </Column>
        <Column>
          <OJOIInput
            label="Texti eftir"
            name="signature-member-after"
            defaultValue={textAfter}
            onChange={(e) => debouncedChange('textAfter', e.target.value)}
          />
        </Column>
      </Columns>
      <Columns space={2}>
        <Column>
          <Inline justifyContent="spaceBetween" alignY="center">
            <OJOIInput
              label="Texti undir"
              name="signature-member-below"
              defaultValue={textBelow}
              onChange={(e) => debouncedChange('textBelow', e.target.value)}
            />
            <Button
              disabled={!onDelete}
              icon="trash"
              variant="utility"
              iconType="outline"
              size="small"
              onClick={() => onDelete && onDelete()}
            >
              Eyða meðlim
            </Button>
          </Inline>
        </Column>
      </Columns>
    </Stack>
  )
}
