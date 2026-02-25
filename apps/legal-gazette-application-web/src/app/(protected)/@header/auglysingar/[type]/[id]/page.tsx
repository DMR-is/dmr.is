import { Header } from '@dmr.is/ui/components/Header/Header'

import { FormTypes } from '../../../../../../lib/constants'

export default async function ApplicationHeader({
  params,
}: {
  params: Promise<{ type: FormTypes }>
}) {
  const { type } = await params
  let description = undefined
  switch (type) {
    case FormTypes.COMMON:
      description = 'Almenn auglýsing'
      break
    case FormTypes.DECEASED:
      description = 'Innköllun dánarbús'
      break
    case FormTypes.BANKRUPTCY:
      description = 'Innköllun þrotabús'
      break
  }

  return (
    <Header
      variant="white"
      info={{ title: 'Lögbirtingablað', description: description }}
    />
  )
}
