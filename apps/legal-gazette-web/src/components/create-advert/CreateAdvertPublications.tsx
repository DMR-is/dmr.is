import { useState } from 'react'

import { Button } from '@dmr.is/ui/components/island-is/Button'
import { DatePicker } from '@dmr.is/ui/components/island-is/DatePicker'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'

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
    <GridContainer>
      <GridRow rowGap={[2, 3]}>
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
                  selected={new Date(publication)}
                  placeholderText=""
                  size="sm"
                  backgroundColor="blue"
                  handleChange={(date) => {
                    const updatedPubs = publications.map((pub, i) =>
                      i === index ? date.toISOString() : pub,
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
                const newPubs = [...publications, new Date().toISOString()]
                setPublications(newPubs)
                handleChange(newPubs)
              }}
            >
              Bæta við birtingardegi
            </Button>
          </Stack>
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
