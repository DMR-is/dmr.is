import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'

import { CreateCommonAdvertModal } from '../../../../../components/create-advert/modals/CreateCommonAdvertModal'
import { CreateBankruptcyAdvertModal } from '../../../../../components/create-advert/modals/CreateRecallBankruptcyAdvertModal'
import { CreateDeceasedAdvertModal } from '../../../../../components/create-advert/modals/CreateRecallDeceasedAdvertModal'
import { RitstjornHero } from '../../../../../components/ritstjorn/Hero'

export const dynamicParams = false

export function generateStaticParams() {
  const slugs = ['almenn', 'throtabu', 'danarbu'] as const
  return slugs.map((slug) => ({ type: slug }))
}

export default async function CreatePage({
  params,
}: {
  params: { type: string }
}) {
  const { type } = params
  return (
    <>
      <RitstjornHero />
      <GridContainer>
        {type === 'almenn' && <CreateCommonAdvertModal />}

        {type === 'throtabu' && <CreateBankruptcyAdvertModal />}
        {type === 'danarbu' && <CreateDeceasedAdvertModal />}
      </GridContainer>
    </>
  )
}
