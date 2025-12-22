/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { CommunicationChannelFields } from '../fields/CommunicationChannelFields'
import { PublishingFields } from '../fields/PublishingFields'
import { SignatureFields } from '../fields/SignatureFields'
import { RecallAdvertFields } from './fields/RecallAdvertFields'
import { RecallDivisionFields } from './fields/RecallDivisionFields'
import { RecallLiquidatorFields } from './fields/RecallLiquidatorFields'
import { RecallRequirementStatementFields } from './fields/RecallRequirementStatementFields'
import { RecallSettlementFields } from './fields/settlement/RecallSettlementFields'

type Props = {
  isBankruptcy: boolean
}

export const RecallForm = ({ isBankruptcy }: Props) => {
  return (
    <>
      <RecallAdvertFields />
      <RecallSettlementFields />
      <RecallLiquidatorFields />
      <RecallRequirementStatementFields />
      <PublishingFields
        additionalTitle="innköllunar"
        applicationType="RECALL"
      />
      <RecallDivisionFields isBankruptcy={isBankruptcy} />
      <SignatureFields />
      <CommunicationChannelFields />
    </>
  )
}
