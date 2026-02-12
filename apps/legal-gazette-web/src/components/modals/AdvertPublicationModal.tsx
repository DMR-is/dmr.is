'use client'

import { useState } from 'react'

import { AdvertDisplay } from '@dmr.is/ui/components/AdvertDisplay/AdvertDisplay'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Select } from '@dmr.is/ui/components/island-is/Select'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'
import { Modal } from '@dmr.is/ui/components/Modal/Modal'

import { AdvertPublicationDto } from '../../gen/fetch'
import { useTRPC } from '../../lib/trpc/client/trpc'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

type Props = {
  advertId: string
  publications: AdvertPublicationDto[]
}

const getPublicationLabel = (pub: AdvertPublicationDto): string => {
  const label = `Útgáfa ${pub.version}`
  return pub.publishedAt ? `${label} (birt)` : label
}

export const AdvertPublicationModal = ({ advertId, publications }: Props) => {
  const [selectedPubId, setSelectedPubId] = useState<string>(publications[0].id)

  const selectedPub = publications.find((p) => p.id === selectedPubId)
  const isPublished = !!selectedPub?.publishedAt

  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const { data } = useQuery(
    trpc.getPublication.queryOptions(
      { id: selectedPubId },
      {
        gcTime: 0,
      },
    ),
  )

  const { mutate: regeneratePdf, isPending: isRegenerating } = useMutation(
    trpc.regeneratePdf.mutationOptions({
      onSuccess: () => {
        toast.success('PDF búið til')
        queryClient.invalidateQueries(
          trpc.getAdvert.queryFilter({ id: advertId }),
        )
      },
      onError: () => {
        toast.error('Ekki tókst að búa til PDF')
      },
    }),
  )

  return (
    <Modal
      disclosure={
        <Button variant="ghost" size="small" fluid truncate>
          <Text color="currentColor" fontWeight="semiBold" variant="small">
            Skoða auglýsingu
          </Text>
        </Button>
      }
      baseId={`advert-publication-modal-${selectedPubId}`}
    >
      <div className="print-hidden">
        <Inline
          space={1}
          flexWrap="wrap"
          justifyContent="spaceBetween"
          alignY={'center'}
        >
          <Box>
            <Inline space={1} justifyContent={'spaceBetween'} alignY={'center'}>
              <Select
                size="sm"
                backgroundColor="blue"
                value={
                  selectedPub
                    ? {
                        label: getPublicationLabel(selectedPub),
                        value: selectedPub.id,
                      }
                    : null
                }
                options={publications.map((pub) => ({
                  label: getPublicationLabel(pub),
                  value: pub.id,
                }))}
                onChange={(opt) => {
                  if (opt?.value) {
                    setSelectedPubId(opt.value)
                  }
                }}
              />
              <Button
                circle
                icon="print"
                iconType="outline"
                colorScheme="negative"
                onClick={() => window.print()}
                title="Prenta"
              />
            </Inline>
          </Box>

          <Box>
            {isPublished && (
              <Button
                circle
                icon="reload"
                iconType="outline"
                colorScheme="negative"
                loading={isRegenerating}
                title="Endurgera PDF"
                onClick={() =>
                  regeneratePdf({
                    advertId,
                    publicationId: selectedPubId,
                  })
                }
              />
            )}
          </Box>
        </Inline>
      </div>

      <AdvertDisplay html={data?.html} withStyles />
    </Modal>
  )
}
