'use client'

import React from 'react'

import { Accordion } from '@dmr.is/ui/components/island-is/Accordion'
import { AccordionItem } from '@dmr.is/ui/components/island-is/AccordionItem'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'

import { useToggle } from '../../hooks/useToggle'
import { OpenCloseButton } from '../buttons/OpenCloseButton'

type AccordionFormItem = {
  title: string
  children: React.ReactNode
  hidden?: boolean
}

type Props = {
  items: AccordionFormItem[]
}

export const AdvertFormAccordion = ({ items }: Props) => {
  const toggles = items.map((_, index) => useToggle(index !== 0))

  const expandAll = () => {
    toggles.forEach(([_tog, setToggle]) => setToggle(true))
  }

  const closeAll = () => {
    toggles.forEach(([_tog, setToggle]) => setToggle(false))
  }

  const isSomeOpen = toggles.some(([tog]) => tog)

  return (
    <Box>
      <Stack space={4}>
        <Inline
          space={2}
          alignY="center"
          flexWrap="wrap"
          justifyContent="spaceBetween"
        >
          <OpenCloseButton
            label={isSomeOpen ? 'Loka fellilista' : 'Opna fellista'}
            onClick={() => (isSomeOpen ? closeAll() : expandAll())}
            isOpen={isSomeOpen}
          />
        </Inline>
        <Accordion singleExpand={false}>
          {items
            .filter((item) => !item.hidden)
            .map((accordionItem: AccordionFormItem, index) => (
              <AccordionItem
                id={`accordion-item-${index}`}
                key={index}
                expanded={toggles[index][0]}
                onToggle={toggles[index][1]}
                label={accordionItem.title}
                labelVariant="h5"
                iconVariant="small"
              >
                {accordionItem.children}
              </AccordionItem>
            ))}
        </Accordion>
      </Stack>
    </Box>
  )
}
