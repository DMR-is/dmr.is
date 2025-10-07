'use client'

import React from 'react'

import { Box } from '@island.is/island-ui/core'

import { BaseAdvertAccordionItem } from './accordion-items/BaseAdvertAccordionItem'
import { ContentAccordionItem } from './accordion-items/ContentAccordionItem'
import { CourtAndJudgementAccordionItem } from './accordion-items/CourtAndJudgementAccordionItem'
import { DivisionMeetingAccordionItem } from './accordion-items/DivisionMeetingAccordionItem'
import { PublicationsAccordionItem } from './accordion-items/PublicationsAccordionItem'
import { ReadOnlyAccordionItem } from './accordion-items/ReadOnlyAccordionItem'
import { SettlementAccordionItem } from './accordion-items/SettlementAccordionItem'
import { SignatureAccordionItem } from './accordion-items/SignatureAccordionItem'
import * as styles from './AdvertFormAccordion.css'

const accordionItems = [
  <ReadOnlyAccordionItem />,
  <BaseAdvertAccordionItem />,
  <ContentAccordionItem />,
  <CourtAndJudgementAccordionItem />,
  <DivisionMeetingAccordionItem />,
  <SettlementAccordionItem />,
  <SignatureAccordionItem />,
  <PublicationsAccordionItem />,
]

export const AdvertFormAccordion = () => (
  <Box className={styles.advertFormAccordion}>
    {accordionItems.map((Item, index) => (
      <div key={index} className={styles.fieldWrapper}>
        {Item}
      </div>
    ))}
  </Box>
)
