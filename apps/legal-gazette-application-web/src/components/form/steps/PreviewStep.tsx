import { AdvertDisplay } from '@dmr.is/ui/components/AdvertDisplay/AdvertDisplay'

type Props = {
  html: string
}

export const PreviewStep = ({ html }: Props) => {
  return <AdvertDisplay html={html} />
}
