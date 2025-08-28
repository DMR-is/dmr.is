import useSWRMutation from 'swr/mutation'

import { Box, Button, Stack, Text, toast } from '@island.is/island-ui/core'

import { AdvertDto } from '../../gen/fetch'
import { getAdvertPdf } from '../../lib/fetchers'
import { formatDate } from '../../lib/utils'
import { AdvertInfoItem } from './AdvertInfoItem'

type Props = {
  advert: AdvertDto
}

export const AdvertInfo = ({ advert }: Props) => {
  const { trigger: downloadPdf } = useSWRMutation(
    ['getAdvertPdf', advert.id],
    ([_key, advertId]) => getAdvertPdf({ id: advertId }),
    {
      onSuccess(data) {
        const blob = new Blob([data], { type: 'application/pdf' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `${advert.title}.pdf`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      },
      onError() {
        toast.error('Ekki tóskt að sækja pdf útgáfu', {
          toastId: 'advert-pdf-download-error',
        })
      },
    },
  )

  return (
    <Box borderRadius="large" padding={4} background="blue100">
      <Stack space={2}>
        <Text variant="h3" marginBottom={1}>
          Upplýsingar um auglýsingu
        </Text>
        <AdvertInfoItem title="Eigandi" value={advert.owner} variant="blue" />
        <AdvertInfoItem title="Tegund" value={advert.type.title} />
        <AdvertInfoItem title="Flokkur" value={advert.category.title} />
        <AdvertInfoItem
          title="Skráningardagur"
          value={formatDate(advert.createdAt)}
        />
        {advert.publishedAt && (
          <AdvertInfoItem
            title="Útgáfudagur"
            value={formatDate(advert.publishedAt)}
          />
        )}
        <Button
          size="small"
          icon="download"
          iconType="outline"
          onClick={() => downloadPdf()}
          variant="text"
        >
          Sækja pdf útgáfu
        </Button>
      </Stack>
    </Box>
  )
}
