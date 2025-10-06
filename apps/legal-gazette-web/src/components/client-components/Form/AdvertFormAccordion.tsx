'use client'

import { Accordion } from '@island.is/island-ui/core'

import { BaseAdvertFields } from '../ritstjorn/fields/BaseAdvertFields'
import { ContentFields } from '../ritstjorn/fields/ContentsField'
import { CourtAndJudgementFields } from '../ritstjorn/fields/CourtAndJudgmentFields'
import { DivisionMeetingFields } from '../ritstjorn/fields/DivisionMeetingFields'
import { PublicationsFields } from '../ritstjorn/fields/PublicationsField'
import { ReadOnlyFields } from '../ritstjorn/fields/ReadOnlyFields'
import { SettlementFields } from '../ritstjorn/fields/SettlementFields'
import { SignatureFields } from '../ritstjorn/fields/SignatureFields'

export const AdvertFormAccordion = () => {
  return (
    <Accordion
      dividers={true}
      dividerOnTop={false}
      dividerOnBottom={false}
      singleExpand={false}
      space={2}
    >
      <ReadOnlyFields />
      <BaseAdvertFields />
      <ContentFields />
      <CourtAndJudgementFields />
      <DivisionMeetingFields />
      <SettlementFields />
      <SignatureFields />
      <PublicationsFields />
    </Accordion>
  )
}
