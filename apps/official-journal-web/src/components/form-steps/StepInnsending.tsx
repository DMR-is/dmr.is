import format from 'date-fns/format'
import is from 'date-fns/locale/is'

import { Box, Inline, Input, Stack, Tag, Text } from '@island.is/island-ui/core'

import { Case } from '../../gen/fetch'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { AdvertDisplay } from '../advert-display/AdvertDisplay'

type Props = {
  activeCase: Case
}

export const StepInnsending = ({ activeCase }: Props) => {
  const { formatMessage } = useFormatMessage()

  return (
    <Stack space={2}>
      <Inline space={1}>
        {[
          { title: activeCase.advert.department.title },
          ...activeCase.advert.categories,
        ]?.map((cat, i) => (
          <Tag key={i} variant="white" outlined disabled>
            {cat.title}
          </Tag>
        ))}
      </Inline>

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
    </Stack>
  )
}
