import { redirect } from 'next/navigation'

import { GridContainer } from '@dmr.is/ui/components/island-is'

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
  params: Promise<{ type: string }>
}) {
  const { type } = await params
  const handleSubmit = async  () => {
    'use server'
    redirect('/ritstjorn')
  }
  return (
    <>
      <RitstjornHero />
      <GridContainer>
        {type === 'almenn' && (
          <CreateCommonAdvertModal handleSubmit={handleSubmit} />
        )}

        {type === 'throtabu' && (
          <CreateBankruptcyAdvertModal handleSubmit={handleSubmit} />
        )}
        {type === 'danarbu' && (
          <CreateDeceasedAdvertModal handleSubmit={handleSubmit} />
        )}
      </GridContainer>
    </>
  )
}
