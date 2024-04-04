import format from 'date-fns/format'
import is from 'date-fns/locale/is'

import { Inline, Select, Stack, Text } from '@island.is/island-ui/core'

import { Case, CaseTagEnum } from '../../gen/fetch'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { enumToOptions } from '../../lib/utils'
import { AdvertDisplay } from '../advert-display/AdvertDisplay'

type Props = {
  activeCase: Case
}

export const StepYfirlestur = ({ activeCase }: Props) => {
  const { formatMessage } = useFormatMessage()

  const tagOptions = enumToOptions(CaseTagEnum)

  return (
    <Stack space={2}>
      <Text variant="h5">Meginmál</Text>

      <AdvertDisplay
        advertNumber={activeCase.advert.publicationNumber?.full}
        signatureDate={
          activeCase.advert.signatureDate
            ? format(
                new Date(activeCase.advert.signatureDate),
                'dd. MMMM yyyy',
                {
                  locale: is,
                },
              )
            : undefined
        }
        advertType={activeCase.advert.type.title}
        advertSubject={activeCase.advert.subject ?? ''}
        advertText={activeCase.advert.document.html ?? ''}
        isLegacy={activeCase.advert.document.isLegacy ?? false}
      />

      <Inline>
        <Select
          name="title"
          value={tagOptions.find((o) => o.value === activeCase?.tag)}
          options={tagOptions}
          label="Merking"
          size="sm"
        />
      </Inline>
    </Stack>
  )
}
