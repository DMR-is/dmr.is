'use client'

import { parseAsStringLiteral, useQueryState } from 'nuqs'

import { Tabs } from '@dmr.is/ui/components/island-is/Tabs'

import { type PartnerClientDto } from '../gen/fetch/types.gen'
import { tabsText } from '../lib/text'
import { CompanyApiKeysTab } from './CompanyApiKeysTab'
import { DelegationsTab } from './DelegationsTab'
import { ProviderKeysTab } from './ProviderKeysTab'

const TAB_IDS = [
  'thjonustuadilar',
  'adgangslyklar',
  'lyklar-thjonustuadila',
] as const
type TabId = (typeof TAB_IDS)[number]

type Props = {
  /** Null when the signed-in kennitala is not in the employer register: both
   *  company tabs need the row, so they are left out rather than failing. */
  companyName: string | null
  partnerClient: PartnerClientDto | null
}

/**
 * The two ways to file — through a provider, or directly with a key — and, for
 * an organisation that is itself an approved provider, its own vendor keys.
 *
 * The selected tab is kept in the URL so a link can open on it, e.g. a
 * provider's instructions pointing a customer straight at the consent tab.
 */
export const AccessTabs = ({ companyName, partnerClient }: Props) => {
  const tabs = [
    ...(companyName !== null
      ? [
          {
            id: 'thjonustuadilar' as TabId,
            label: tabsText.delegations,
            content: <DelegationsTab companyName={companyName} />,
          },
          {
            id: 'adgangslyklar' as TabId,
            label: tabsText.apiKeys,
            content: <CompanyApiKeysTab />,
          },
        ]
      : []),
    ...(partnerClient
      ? [
          {
            id: 'lyklar-thjonustuadila' as TabId,
            label: tabsText.providerKeys,
            content: <ProviderKeysTab partnerClient={partnerClient} />,
          },
        ]
      : []),
  ]

  const [selected, setSelected] = useQueryState(
    'flipi',
    parseAsStringLiteral(TAB_IDS),
  )

  if (tabs.length === 0) {
    return null
  }

  // A link to a tab this organisation does not have falls back to the first.
  const current = tabs.some((tab) => tab.id === selected)
    ? (selected as TabId)
    : tabs[0].id

  return (
    <Tabs
      label={tabsText.label}
      tabs={tabs}
      contentBackground="white"
      selected={current}
      onChange={(id) => setSelected(id as TabId)}
    />
  )
}
