import { useState } from 'react'
import useSWRMutation from 'swr/mutation'

import {
  Box,
  GridColumn,
  GridContainer,
  GridRow,
  ModalBase,
} from '@island.is/island-ui/core'

import {
  AddDivisionEndingAdvertToApplicationRequest,
  AddDivisionEndingForApplicationDto,
} from '../../../gen/fetch'
import { addDivisionEnding } from '../../../lib/fetchers'
import { Center } from '../center/Center'

type Props = {
  isVisible: boolean
  onVisibilityChange: (isVisible: boolean) => void
}

export const CreateDivisionEnding = ({
  isVisible,
  onVisibilityChange,
}: Props) => {
  const { trigger, isMutating } = useSWRMutation(
    'addDivisionEnding',
    (
      _key: string,
      { arg }: { arg: AddDivisionEndingAdvertToApplicationRequest },
    ) => addDivisionEnding(arg),
  )

  const [createState, setCreateState] =
    useState<AddDivisionEndingForApplicationDto>({
      declaredClaims: 0,
      signatureDate: '',
      signatureLocation: '',
      signatureName: '',
      signatureOnBehalfOf: '',
      additionalText: '',
    })
  return (
    <ModalBase
      baseId="create-division-ending-modal"
      isVisible={isVisible}
      onVisibilityChange={onVisibilityChange}
    >
      {({ closeModal }) => (
        <Center fullHeight={true}>
          <GridContainer>
            <GridRow rowGap={[2, 3, 4]}>
              <GridColumn span={['12/12', '8/12']} offset={['0', '2/12']}>
                <Box padding={[2, 3, 4]} width="full" background="white">
                  <h2>Division Ending</h2>
                  <button onClick={closeModal}>Close</button>
                </Box>
              </GridColumn>
            </GridRow>
          </GridContainer>
        </Center>
      )}
    </ModalBase>
  )
}
