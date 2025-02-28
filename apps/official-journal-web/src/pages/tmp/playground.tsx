import { Hero } from '@dmr.is/ui'

export default function PlayGroundPage() {
  return (
    <main>
      <Hero
        title="Lögbirtingablað"
        description="Umsýslukerfi Lögbirtingablaðs, morem ipsum dolor sit amet, consectetur adipiscing elit."
        image={{
          src: '/assets/banner-image.svg',
          alt: 'Image alt',
        }}
      />
    </main>
  )
}
