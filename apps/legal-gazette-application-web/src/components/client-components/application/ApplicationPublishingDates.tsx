'use client'

import { useState } from 'react'

import {
  Box,
  Button,
  DatePicker,
  Inline,
  Stack,
} from '@island.is/island-ui/core'

type Props = {
  publishingDates: string[]
  onDateChange: (dates: string[]) => void
}

export const ApplicationPublishingDates = ({
  publishingDates,
  onDateChange,
}: Props) => {
  const [dates, setDates] = useState<string[]>(
    publishingDates.length > 0 ? publishingDates : [new Date().toISOString()],
  )

  const handleAddDate = () => {
    const dateToBeAdded = new Date(dates[dates.length - 1])
    dateToBeAdded.setDate(dateToBeAdded.getDate() + 28)

    const newDates = [...dates, dateToBeAdded.toISOString()]

    setDates(newDates)
    onDateChange(newDates)
  }

  const handleRemoveDate = (index: number) => {
    const newDates = dates.filter((_, i) => i !== index)
    setDates(newDates)
    onDateChange(newDates)
  }

  const findMinDate = (index: number) => {
    if (index === 0) return new Date()
    const previousDate = new Date(dates[index - 1])
    previousDate.setDate(previousDate.getDate() + 1)
    return previousDate
  }

  return (
    <Stack space={2}>
      {dates.map((d, i) => (
        <Inline alignY="center" space={2} key={i}>
          <DatePicker
            size="sm"
            selected={new Date(d)}
            minDate={findMinDate(i)}
            label={`Birtingardagur ${i + 1}`}
            placeholderText={undefined}
            locale="is"
            handleChange={(date) => {
              const newDates = [...dates]
              newDates[i] = date.toISOString()
              setDates(newDates)
              onDateChange(newDates)
            }}
          />
          <Button
            disabled={dates.length <= 1}
            colorScheme="destructive"
            icon="trash"
            size="small"
            iconType="outline"
            variant="ghost"
            onClick={() => handleRemoveDate(i)}
          />
        </Inline>
      ))}
      <Button
        disabled={dates.length >= 3}
        variant="utility"
        icon="add"
        onClick={handleAddDate}
      >
        Bæta við birtingardegi
      </Button>
    </Stack>
  )
}
