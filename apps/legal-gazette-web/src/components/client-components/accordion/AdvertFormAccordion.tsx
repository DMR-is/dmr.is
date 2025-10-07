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
    toggles.forEach((toggle) => toggle.setExpanded(true))
  }

  const closeAll = () => {
    toggles.forEach((toggle) => toggle.setExpanded(false))
  }

  const isSomeOpen = toggles.some((toggle) => toggle.expanded)

  const accordionItems = [
    <ReadOnlyAccordionItem
      expanded={readOnlyToggle.expanded}
      onToggle={() => readOnlyToggle.setExpanded((prev) => !prev)}
    />,
    <BaseAdvertAccordionItem
      expanded={baseAdvertToggle.expanded}
      onToggle={() => baseAdvertToggle.setExpanded((prev) => !prev)}
    />,
    <ContentAccordionItem
      expanded={contentToggle.expanded}
      onToggle={() => contentToggle.setExpanded((prev) => !prev)}
    />,
    <CourtAndJudgementAccordionItem
      expanded={courtAndJudgementToggle.expanded}
      onToggle={() => courtAndJudgementToggle.setExpanded((prev) => !prev)}
    />,
    <DivisionMeetingAccordionItem
      expanded={divisionMeetingToggle.expanded}
      onToggle={() => divisionMeetingToggle.setExpanded((prev) => !prev)}
    />,
    <SettlementAccordionItem
      expanded={settlementToggle.expanded}
      onToggle={() => settlementToggle.setExpanded((prev) => !prev)}
    />,
    <SignatureAccordionItem
      expanded={signatureToggle.expanded}
      onToggle={() => signatureToggle.setExpanded((prev) => !prev)}
    />,
    <PublicationsAccordionItem
      expanded={publicationsToggle.expanded}
      onToggle={() => publicationsToggle.setExpanded((prev) => !prev)}
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
