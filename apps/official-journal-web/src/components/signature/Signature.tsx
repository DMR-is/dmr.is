import { Column, Columns, DatePicker, Stack } from '@island.is/island-ui/core'

import { useCaseContext } from '../../hooks/useCaseContext'
import { SignatureDislay } from '../advert-display/SignatureDisplay'
import { ContentWrapper } from '../content-wrapper/ContentWrapper'
import { OJOIInput } from '../select/OJOIInput'
import { SignatureMember } from './SignatureMember'

export const Signature = () => {
  const { currentCase } = useCaseContext()

  const { signatures } = currentCase

  return (
    <Stack space={2}>
      {signatures.map((s, i) => (
        <Stack space={2} key={i}>
          <ContentWrapper
            titleVariant="h5"
            titleAs="h5"
            title="Stofnun og dagsetning"
          >
            <Columns space={2}>
              <Column>
                <OJOIInput
                  defaultValue={s.institution}
                  label="Stofnun"
                  name="institution"
                />
              </Column>
              <Column>
                <DatePicker
                  label="Dagsetning undirritunar"
                  name="signature-date"
                  selected={new Date(s.date)}
                  placeholderText="Dagsetning undirritunar"
                  size="sm"
                  backgroundColor="blue"
                />
              </Column>
            </Columns>
          </ContentWrapper>
          <ContentWrapper titleVariant="h5" titleAs="h5" title="Undirritað af">
            {s.members.map((m, j) => (
              <SignatureMember {...m} key={j} />
            ))}
          </ContentWrapper>
          <SignatureDislay />
        </Stack>
      ))}
    </Stack>
  )
}
