import { useState } from 'react'

import { Button } from '@dmr.is/ui/components/island-is/Button'
import { DatePicker } from '@dmr.is/ui/components/island-is/DatePicker'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import {
  fromCalendarDateIso,
  toCalendarDateIso,
} from '@dmr.is/utils-shared/date/calendarDate'

type Props = {
  onChange: (publications: string[]) => void
}

export const CreateAdvertPublications = ({ onChange }: Props) => {
  const [publications, setPublications] = useState<string[]>([])

  const canAdd = publications.length < 3
  const canRemove = publications.length > 1

  const handleChange = (pubs: string[]) => {
    onChange(pubs)
  }

  return (
    <>
      <GridColumn span="12/12">
        <Text variant="h4">Birting</Text>
      </GridColumn>
      <GridColumn span="12/12">
        <Stack space={[1, 2]}>
          {publications.map((publication, index) => (
            <Inline key={index} space={[1, 2]} alignY="center">
              <DatePicker
                locale="is"
                label={`Birtingardagur ${index + 1}`}
                selected={fromCalendarDateIso(publication)}
                placeholderText=""
                size="sm"
                backgroundColor="blue"
                handleChange={(date) => {
                  // The picked day, not local midnight as an instant, which
                  // from a browser east of UTC lands on the previous day.
                  const updatedPubs = publications.map((pub, i) =>
                    i === index ? toCalendarDateIso(date) : pub,
                  )
                  setPublications(updatedPubs)
                  handleChange(updatedPubs)
                }}
              />
              <Button
                disabled={!canRemove}
                size="small"
                circle
                colorScheme="destructive"
                icon="trash"
                onClick={() => {
                  const filtered = publications.filter((_, i) => i !== index)
                  setPublications(filtered)
                  handleChange(filtered)
                }}
              />
            </Inline>
          ))}
          <Button
            disabled={!canAdd}
            variant="utility"
            size="small"
            icon="add"
            iconType="outline"
            onClick={() => {
              const newPubs = [...publications, toCalendarDateIso(new Date())]
              setPublications(newPubs)
              handleChange(newPubs)
            }}
          >
            Bæta við birtingardegi
          </Button>
        </Stack>
      </GridColumn>
    </>
  )
}
