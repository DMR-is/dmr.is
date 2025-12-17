import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'

import { useState } from 'react'

import {
  Box,
  Button,
  GridColumn,
  GridContainer,
  GridRow,
  Input,
  Stack,
  Text,
} from '@island.is/island-ui/core'

import { Meta } from '../../components/meta/Meta'
import { Section } from '../../components/section/Section'
import { usePublishAdvertRegulation } from '../../hooks/api/post/usePublishAdvertRegulation'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { messages } from '../../lib/messages/casePublishOverview'
import { loginRedirect } from '../../lib/utils'
import { authOptions } from '../api/auth/[...nextauth]'

export default function AdvertPublishRegulation() {
  const { formatMessage } = useFormatMessage()
  const [advertId, setAdvertId] = useState<string | null>('')
  const { publishRegulation, loading } = usePublishAdvertRegulation()

  return (
    <>
      <Meta title={`${formatMessage(messages.breadcrumbs.dashboard)}`} />
      <Section paddingTop="content">
        <GridContainer>
          <GridRow>
            <GridColumn
              span={['12/12', '12/12', '12/12', '10/12']}
              offset={['0', '0', '0', '1/12']}
            >
              <Text marginBottom={4}>
                Senda reglugerð í ritstjórnarkerfi reglugerða. Þetta input tekur
                við id auglýsingar.
              </Text>
              <Stack space={2}>
                <Input
                  name="advert-id"
                  type="text"
                  label="Auðkenni auglýsingar"
                  placeholder="123456"
                  backgroundColor="white"
                  onChange={(e) => {
                    setAdvertId(e.target.value)
                  }}
                />
                <Box>
                  <Button
                    variant="ghost"
                    size="small"
                    icon="arrowForward"
                    iconType="outline"
                    type="button"
                    loading={loading}
                    onClick={() =>
                      publishRegulation({ advertId: advertId ?? '' })
                    }
                  >
                    Senda reglugerð
                  </Button>
                </Box>
              </Stack>
            </GridColumn>
          </GridRow>
        </GridContainer>
      </Section>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async ({
  req,
  res,
  resolvedUrl,
}) => {
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return loginRedirect(resolvedUrl)
  }

  return { props: {} }
}
