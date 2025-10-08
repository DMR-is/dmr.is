'use client'

import React from 'react'

import {
  Accordion,
  AccordionItem,
  Inline,
} from '@dmr.is/ui/components/island-is'
import { Stack } from '@dmr.is/ui/components/island-is'

import { Box } from '@island.is/island-ui/core'

import { useToggle } from '../../../hooks/useToggle'
import { OpenCloseButton } from '../buttons/OpenCloseButton'

type AccordionFormItem = {
  title: string
  children: React.ReactNode
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
      <Stack space={8}>
        <Inline alignY="center" align="right">
          <OpenCloseButton
            label={isSomeOpen ? 'Loka fellilista' : 'Opna fellista'}
            onClick={() => (isSomeOpen ? closeAll() : expandAll())}
            isOpen={isSomeOpen}
          />
        </Inline>
      </Stack>
      <Accordion>
        {items.map((item, index) => (
          <AccordionItem
            id={`accordion-item-${index}`}
            key={index}
            expanded={toggles[index].expanded}
            onToggle={toggles[index].setExpanded}
            label={item.title}
          >
            {item.children}
          </AccordionItem>
        ))}
      </Accordion>
    </Box>
  )
}
