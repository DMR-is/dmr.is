'use client'

import { Hero as DMRHero } from '@dmr.is/ui/components/Hero/Hero'

type Props = React.ComponentProps<typeof DMRHero>

export const Hero = (props: Props) => {
  return <DMRHero {...props} />
}
