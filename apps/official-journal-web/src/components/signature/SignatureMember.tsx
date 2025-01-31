import { Column, Columns, Stack } from '@island.is/island-ui/core'

import { SignatureMember as SignatureMemberDto } from '../../gen/fetch'
import { OJOIInput } from '../select/OJOIInput'

type Props = SignatureMemberDto

export const SignatureMember = ({
  text,
  textAbove,
  textAfter,
  textBefore,
  textBelow,
}: Props) => {
  return (
    <Stack space={2}>
      <Columns space={2}>
        <Column>
          <OJOIInput
            label="Texti yfir"
            name="signature-member-above"
            defaultValue={textAbove}
          />
        </Column>
      </Columns>
      <Columns space={2}>
        <Column>
          <OJOIInput
            label="Nafn"
            name="signature-member-name"
            defaultValue={text}
          />
        </Column>
        <Column>
          <OJOIInput
            label="Texti eftir"
            name="signature-member-after"
            defaultValue={textAfter}
          />
        </Column>
      </Columns>
      <Columns space={2}>
        <Column>
          <OJOIInput
            label="Texti undir"
            name="signature-member-below"
            defaultValue={textBelow}
          />
        </Column>
      </Columns>
    </Stack>
  )
}
