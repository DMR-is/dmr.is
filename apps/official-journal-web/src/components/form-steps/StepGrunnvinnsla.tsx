import {
  Box,
  Checkbox,
  DatePicker,
  Inline,
  Input,
  Select,
  Stack,
  StringOption,
  Tag,
  Text,
} from '@island.is/island-ui/core'

import { Case } from '../../gen/fetch'
import { useFormatMessage } from '../../hooks/useFormatMessage'

type Props = {
  activeCase: Case
}

const departmentOptions: StringOption[] = [
  { label: 'A deild', value: 'A deild' },
  { label: 'B deild', value: 'B deild' },
  { label: 'C deild', value: 'C deild' },
]

const typeOptions: StringOption[] = [
  { label: 'AUGLÝSING', value: 'AUGLÝSING' },
  { label: 'GJALDSKRÁ', value: 'GJALDSKRÁ' },
  { label: 'REGLUGERÐ', value: 'REGLUGERÐ' },
]

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
            name="title"
            value={activeCase?.advert.title}
            label="Heiti auglýsingar"
            size="sm"
          />

          <Inline space={2} alignY="center">
            <Select
              name="department"
              value={departmentOptions.find(
                (o) => o.value === activeCase?.advert.department.title,
              )}
              options={departmentOptions}
              label="Deild"
              size="sm"
            />
          </Inline>

          <Inline space={2} alignY="center">
            <Select
              name="type"
              value={typeOptions.find(
                (o) => o.value === activeCase?.advert.type.title,
              )}
              options={typeOptions}
              label="Tegund"
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
            <DatePicker
              readOnly
              name="createdDate"
              selected={
                activeCase?.advert.createdDate
                  ? new Date(activeCase?.advert.createdDate)
                  : undefined
              }
              label="Dagsetning innsendingar"
              size="sm"
              placeholderText=""
              locale="is"
            />
          </Inline>

          <Inline space={2} alignY="center">
            <DatePicker
              name="publicationDate"
              selected={
                activeCase?.advert.publicationDate
                  ? new Date(activeCase?.advert.publicationDate)
                  : undefined
              }
              label="Dagsetning birtingar"
              size="sm"
              placeholderText=""
              locale="is"
            />

            <Checkbox
              name="fastTrack"
              checked={activeCase.fastTrack}
              label="Óskað er eftir hraðbirtingu"
            />
          </Inline>

          <Inline space={2} alignY="center">
            <Input
              name="price"
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
