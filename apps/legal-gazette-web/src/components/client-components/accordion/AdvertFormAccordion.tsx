'use client'

import React from 'react'

import {
  Accordion,
  AccordionItem,
  Button,
  Inline,
} from '@dmr.is/ui/components/island-is'
import { Stack } from '@dmr.is/ui/components/island-is'

import { Box } from '@island.is/island-ui/core'

import { useToggle } from '../../../hooks/useToggle'
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
  const toggles = items.map(() => useToggle(false))

  const expandAll = () => {
    toggles.forEach((toggle) => toggle.setExpanded(true))
  }

  const closeAll = () => {
    toggles.forEach((toggle) => toggle.setExpanded(false))
  }

  const isSomeOpen = toggles.some((toggle) => toggle.expanded)

  return (
    <Box>
      <Stack space={4}>
        <Inline
          space={2}
          alignY="center"
          flexWrap="wrap"
          justifyContent="spaceBetween"
        >
          <Button
            onClick={() => alert('í vinnslu')}
            variant="utility"
            size="small"
            icon="open"
            iconType="outline"
          >
            Stofna auglýsingu
          </Button>
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
                expanded={toggles[index].expanded}
                onToggle={toggles[index].setExpanded}
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
