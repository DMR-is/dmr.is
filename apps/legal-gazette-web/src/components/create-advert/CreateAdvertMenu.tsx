'use client'

import { useState } from 'react'

import { DropdownMenu } from '@dmr.is/ui/components/island-is'

import { CreateCommonAdvertModal } from './CreateCommonAdvertModal'
import { CreateBankruptcyAdvertModal } from './CreateRecallBankruptcyAdvertModal'
import { CreateDeceasedAdvertModal } from './CreateRecallDeceasedAdvertModal'

export const CretaeAdvertMenu = () => {
  const [toggleCommonAdvert, setToggleCommonAdvert] = useState(false)
  const [toggleBankruptcyAdvert, setToggleBankruptcyAdvert] = useState(false)
  const [toggleDeceasedAdvert, setToggleDeceasedAdvert] = useState(false)

  return (
    <>
      <DropdownMenu
        title="Stofna"
        icon="add"
        iconType="outline"
        openOnHover={false}
        items={[
          {
            title: 'Almenn auglýsing',
            onClick: () => setToggleCommonAdvert((prev) => !prev),
          },
          {
            title: 'Innköllun þrotabús',
            onClick: () => setToggleBankruptcyAdvert((prev) => !prev),
          },
          {
            title: 'Innköllun dánarbús',
            onClick: () => setToggleDeceasedAdvert((prev) => !prev),
          },
        ]}
      />

      <CreateCommonAdvertModal
        isVisible={toggleCommonAdvert}
        setIsVisible={setToggleCommonAdvert}
      />
      <CreateBankruptcyAdvertModal
        isVisible={toggleBankruptcyAdvert}
        setIsVisible={setToggleBankruptcyAdvert}
      />
      <CreateDeceasedAdvertModal
        isVisible={toggleDeceasedAdvert}
        setIsVisible={setToggleDeceasedAdvert}
      />
    </>
  )
}
