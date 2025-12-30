import { Header } from '@dmr.is/ui/components/Header/Header'

import { FormTypes } from '../../../../../../lib/constants'

export default function ApplicationHeader({
  params,
}: {
  params: { type: FormTypes }
}) {
  let description = undefined
  switch (params.type) {
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
