'use client'
import { useState } from 'react'

import {
  Button,
  DatePicker,
  GridColumn,
  GridContainer,
  GridRow,
  Inline,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'

type Props = {
  onChange: (publications: string[]) => void
}

export const CreateAdvertPublications = ({ onChange }: Props) => {
  const [publications, setPublications] = useState<string[]>([
    new Date().toISOString(),
  ])

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
