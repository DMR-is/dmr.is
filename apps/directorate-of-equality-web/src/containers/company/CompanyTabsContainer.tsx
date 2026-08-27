'use client'

import { useState } from 'react'

import { Tabs } from '@island.is/island-ui/core'

import { CompanyApiKeysTab } from '../../components/company/company-tabs/api-keys-tab/CompanyApiKeysTab'
import { CompanyDetailInfoTab } from '../../components/company/company-tabs/info-tab/CompanyDetailInfoTab'
import { CompanyReportsTab } from '../../components/company/company-tabs/reports-tab/CompanyReportsTab'
import { CompanyDto } from '../../gen/fetch'
import { companiesText } from '../../lib/text'

const t = companiesText.detailView

type CompanyTabsContainerProps = {
  company: CompanyDto
}

export function CompanyTabsContainer({ company }: CompanyTabsContainerProps) {
  const [selectedTab, setSelectedTab] = useState('upplysingar')

  const tabs = [
    {
      id: 'upplysingar',
      label: t.tabInfo,
      content: <CompanyDetailInfoTab company={company} />,
    },
    {
      id: 'skyrslur',
      label: t.tabReports,
      content: <CompanyReportsTab companyId={company.id} />,
    },
    {
      id: 'adgangslyklar',
      label: t.tabApiKeys,
      content: <CompanyApiKeysTab companyId={company.id} />,
    },
  ]

  return (
    <Tabs
      label={t.tabsLabel}
      tabs={tabs}
      contentBackground="white"
      selected={selectedTab}
      onChange={setSelectedTab}
    />
  )
}
