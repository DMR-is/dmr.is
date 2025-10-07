'use client'

import React from 'react'

import { Inline } from '@dmr.is/ui/components/island-is'
import { Stack } from '@dmr.is/ui/components/island-is'

import { Box } from '@island.is/island-ui/core'

import { useToggle } from '../../../hooks/useToggle'
import { OpenCloseButton } from '../buttons/OpenCloseButton'
import { BaseAdvertAccordionItem } from './accordion-items/BaseAdvertAccordionItem'
import { ContentAccordionItem } from './accordion-items/ContentAccordionItem'
import { CourtAndJudgementAccordionItem } from './accordion-items/CourtAndJudgementAccordionItem'
import { DivisionMeetingAccordionItem } from './accordion-items/DivisionMeetingAccordionItem'
import { PublicationsAccordionItem } from './accordion-items/PublicationsAccordionItem'
import { ReadOnlyAccordionItem } from './accordion-items/ReadOnlyAccordionItem'
import { SettlementAccordionItem } from './accordion-items/SettlementAccordionItem'
import { SignatureAccordionItem } from './accordion-items/SignatureAccordionItem'
import * as styles from './AdvertFormAccordion.css'

export const AdvertFormAccordion = () => {
  const readOnlyToggle = useToggle(true)
  const baseAdvertToggle = useToggle(false)
  const contentToggle = useToggle(false)
  const courtAndJudgementToggle = useToggle(false)
  const divisionMeetingToggle = useToggle(false)
  const settlementToggle = useToggle(false)
  const signatureToggle = useToggle(false)
  const publicationsToggle = useToggle(false)

  const toggles = [
    readOnlyToggle,
    baseAdvertToggle,
    contentToggle,
    courtAndJudgementToggle,
    divisionMeetingToggle,
    settlementToggle,
    signatureToggle,
    publicationsToggle,
  ]

  const expandAll = () => {
    toggles.forEach((toggle) => toggle.setToggle(true))
  }

  const closeAll = () => {
    toggles.forEach((toggle) => toggle.setToggle(false))
  }

  const isSomeOpen = toggles.some((toggle) => toggle.expanded)

  const accordionItems = [
    <ReadOnlyAccordionItem
      expanded={readOnlyToggle.expanded}
      onToggle={readOnlyToggle.onToggle}
    />,
    <BaseAdvertAccordionItem
      expanded={baseAdvertToggle.expanded}
      onToggle={baseAdvertToggle.onToggle}
    />,
    <ContentAccordionItem
      expanded={contentToggle.expanded}
      onToggle={contentToggle.onToggle}
    />,
    <CourtAndJudgementAccordionItem
      expanded={courtAndJudgementToggle.expanded}
      onToggle={courtAndJudgementToggle.onToggle}
    />,
    <DivisionMeetingAccordionItem
      expanded={divisionMeetingToggle.expanded}
      onToggle={divisionMeetingToggle.onToggle}
    />,
    <SettlementAccordionItem
      expanded={settlementToggle.expanded}
      onToggle={settlementToggle.onToggle}
    />,
    <SignatureAccordionItem
      expanded={signatureToggle.expanded}
      onToggle={signatureToggle.onToggle}
    />,
    <PublicationsAccordionItem
      expanded={publicationsToggle.expanded}
      onToggle={publicationsToggle.onToggle}
    />,
  ]

  return (
    <Box className={styles.advertFormAccordion}>
      <Stack space={8}>
        <Inline alignY="center" align="right">
          <OpenCloseButton
            label={isSomeOpen ? 'Loka fellilista' : 'Opna fellista'}
            onClick={() => (isSomeOpen ? closeAll() : expandAll())}
            isOpen={isSomeOpen}
          />
        </Inline>
        <Box>
          {accordionItems.map((Item, index) => (
            <div key={index} className={styles.accordionItemContainer}>
              {Item}
            </div>
          ))}
        </Box>
      </Stack>
    </Box>
  )
}
