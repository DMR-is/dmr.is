import {
  Box,
  Checkbox,
  Divider,
  Inline,
  Input,
  Stack,
  Tag,
  Text,
} from '@island.is/island-ui/core'

import { Case } from '../../gen/fetch'
import { useFormatMessage } from '../../hooks/useFormatMessage'

type Props = {
  activeCase: Case
}

export const StepGrunnvinnsla = ({ activeCase }: Props) => {
  const { formatMessage } = useFormatMessage()

  return (
    <>
      <Box marginBottom={4}>
        <Stack space={2}>
          <Text variant="h5">Almennt um málið</Text>

          <Input
            readOnly
            name="institution"
            value={activeCase?.advert.involvedParty.title}
            label="Sendandi"
            size="sm"
          />

          <Input
            readOnly
            name="title"
            value={activeCase?.advert.title}
            label="Heiti auglýsingar"
            size="sm"
          />

          <Inline space={2} alignY="center">
            <Input
              readOnly
              name="title"
              value={activeCase?.advert.department.title}
              label="Deild"
              size="sm"
            />
          </Inline>

          <Inline space={2} alignY="center">
            <Input
              readOnly
              name="title"
              value={activeCase?.advert.type.title}
              label="Tegund"
              size="sm"
            />
          </Inline>

          <Inline space={2} alignY="center">
            <Input
              readOnly
              name="date"
              value={activeCase?.advert.publicationDate ?? undefined}
              label="Dagsetning birtingar"
              size="sm"
            />
          </Inline>

          <Inline space={1}>
            {activeCase.advert.categories.map((cat, i) => (
              <Tag key={i} variant="white" outlined disabled>
                {cat.title}
              </Tag>
            ))}
          </Inline>
        </Stack>
      </Box>

      <Box>
        <Stack space={2}>
          <Text variant="h5">Birting</Text>

          <Inline space={1}>
            <Input
              readOnly
              name="title"
              value={activeCase?.advert.createdDate}
              label="Dagsetning innsendingar"
              size="sm"
            />
          </Inline>

          <Inline space={2} alignY="center">
            <Input
              readOnly
              name="title"
              value={activeCase?.advert.publicationDate ?? undefined}
              label="Dagsetning birtingar"
              size="sm"
            />

            <Checkbox
              checked={activeCase.fastTrack}
              label="Óskað er eftir hraðbirtingu"
            />
          </Inline>

          <Inline space={2} alignY="center">
            <Input
              readOnly
              name="title"
              value={activeCase?.price}
              label="Áætlað verð"
              size="sm"
            />
            <Checkbox checked={activeCase.paid} label="Búið er að greiða" />
          </Inline>
        </Stack>
      </Box>
    </>
  )
}
