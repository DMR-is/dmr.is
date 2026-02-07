import { notFound } from 'next/navigation'

import { ParallelModal } from '@dmr.is/ui/components/Modal/ParallelModal'

import { CreateCommonAdvertModal } from '../../../../../../components/create-advert/modals/CreateCommonAdvertModal'
import { CreateBankruptcyAdvertModal } from '../../../../../../components/create-advert/modals/CreateRecallBankruptcyAdvertModal'
import { CreateDeceasedAdvertModal } from '../../../../../../components/create-advert/modals/CreateRecallDeceasedAdvertModal'

type Props = {
  params: {
    type: string
  }
}

export default async function CreateModalPage({ params }: Props) {
  const { type } = params

  if (!['almenn', 'throtabu', 'danarbu'].includes(type)) {
    notFound()
  }

  const title = (() => {
    switch (type) {
      case 'almenn':
        return 'Almenn auglýsing'
      case 'throtabu':
        return 'Innköllun þrotabús'
      case 'danarbu':
        return 'Innköllun dánarbús'
      default:
        return ''
    }
  })()

  return (
    <ParallelModal title={title}>
      {type === 'almenn' && <CreateCommonAdvertModal />}
      {type === 'throtabu' && <CreateBankruptcyAdvertModal />}
      {type === 'danarbu' && <CreateDeceasedAdvertModal />}
    </ParallelModal>
  )
}
