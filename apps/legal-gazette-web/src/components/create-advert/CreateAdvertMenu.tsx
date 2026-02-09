'use client'

import { useRouter } from 'next/navigation'

import { DropdownMenu } from '@dmr.is/ui/components/island-is/DropdownMenu'

export const CreateAdvertMenu = () => {
  const router = useRouter()

  return (
    <DropdownMenu
      title="Stofna"
      icon="add"
      iconType="outline"
      openOnHover={false}
      items={[
        {
          title: 'Almenn auglýsing',
          onClick: () => router.push('/ritstjorn/create/almenn'),
        },
        {
          title: 'Innköllun þrotabús',
          onClick: () => router.push('/ritstjorn/create/throtabu'),
        },
        {
          title: 'Innköllun dánarbús',
          onClick: () => router.push('/ritstjorn/create/danarbu'),
        },
      ]}
    />
  )
}
