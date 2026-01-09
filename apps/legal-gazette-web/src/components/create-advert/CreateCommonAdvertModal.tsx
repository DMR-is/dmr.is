'use client'

import { useState } from 'react'
import z from 'zod'

import {
  Button,
  GridColumn,
  GridContainer,
  GridRow,
} from '@dmr.is/ui/components/island-is'
import { Modal } from '@dmr.is/ui/components/Modal/Modal'

import { createAdvertAndCommonApplicationInput } from '../../lib/inputs'
import { useTRPC } from '../../lib/trpc/client/trpc'
import { CategorySelect } from '../selects/CategorySelect'
import { TypeSelect } from '../selects/TypeSelect'

import { useQueryClient } from '@tanstack/react-query'

type CreateAdvertAndCommonApplicationBody = z.infer<
  typeof createAdvertAndCommonApplicationInput
>

const initalState: CreateAdvertAndCommonApplicationBody = {
  applicantNationalId: '',
  additionalText: undefined,
  prequisitesAccepted: true,
  communicationChannels: [],
  publishingDates: [],
  signature: {},
  fields: {
    caption: '',
    html: '',
    category: {
      id: '',
      title: '',
      slug: '',
    },
    type: {
      id: '',
      title: '',
      slug: '',
    },
  },
}

export const CreateCommonAdvertModal = () => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const [isVisible, setIsVisible] = useState(false)
  const [state, setState] =
    useState<CreateAdvertAndCommonApplicationBody>(initalState)

  const disclosure = (
    <Button
      variant="utility"
      size="small"
      icon="add"
      iconType="outline"
      onClick={() => setIsVisible(true)}
    >
      Almenn auglýsing
    </Button>
  )

  return (
    <Modal
      disclosure={disclosure}
      baseId="create-advert-and-common-application-modal"
      onVisibilityChange={setIsVisible}
      isVisible={isVisible}
      title="Bæta við almennri auglýsingu og umsókn"
    >
      <GridContainer></GridContainer>
      <GridRow>
        <GridColumn span={['12/12', '6/12']}>
          <TypeSelect
            selectedId={state.fields.type.id}
            onSelect={(type) => {
              if (!type) return
              setState((prev) => ({
                ...prev,
                fields: {
                  ...prev.fields,
                  type: type,
                  category: { id: '', title: '', slug: '' }, // Reset category when type changes
                },
              }))
            }}
          />
        </GridColumn>
        <GridColumn span={['12/12', '6/12']}>
          <CategorySelect
            typeId={state.fields.type.id}
            selectedId={state.fields.category.id}
            onSelect={(cat) => {
              if (!cat) return
              setState((prev) => ({
                ...prev,
                fields: {
                  ...prev.fields,
                  category: cat,
                },
              }))
            }}
          />
        </GridColumn>
      </GridRow>
    </Modal>
  )
}
