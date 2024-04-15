import { useRouter } from 'next/router'
import { Fragment, ReactNode } from 'react'

import {
  Box,
  GridColumn,
  GridContainer,
  GridRow,
  Text,
} from '@island.is/island-ui/core'

import { withMainLayout } from '../../layout/Layout'
import { Screen } from '../../lib/types'

type MessageType = {
  title: string
  body?: string
}

const nlToBr = (text: string): ReactNode =>
  text.split(/\r\n|\r|\n/g).map((s, i) => (
    <Fragment key={i}>
      {i > 0 && <br />}
      {s}
    </Fragment>
  ))

const formatBody = (body: string, path: string): ReactNode =>
  body?.split('{PATH}').map((s, i) => (
    <Fragment key={i}>
      {i > 0 && <i>{path}</i>}
      {nlToBr(s)}
    </Fragment>
  ))

const fallbackMessage = {
  404: {
    title: 'Síða fannst ekki',
    body: 'Ekkert fannst á slóðinni {PATH}.\nMögulega hefur síðan verið fjarlægð eða færð til.',
  },
  500: {
    title: 'Afsakið hlé.',
    body: 'Eitthvað fór úrskeiðis.\nVillan hefur verið skráð og unnið verður að viðgerð eins fljótt og auðið er.',
  },
}

interface ErrorProps {
  statusCode?: number
}

const ErrorScreen: Screen<ErrorProps> = ({ statusCode }) => {
  const { asPath } = useRouter()
  const errorMessages: MessageType =
    fallbackMessage[statusCode as keyof typeof fallbackMessage]

  return (
    <GridContainer>
      <GridRow>
        <GridColumn span={'12/12'} paddingBottom={10} paddingTop={8}>
          <Box
            display="flex"
            flexDirection="column"
            width="full"
            alignItems="center"
          >
            <Text
              variant="eyebrow"
              as="div"
              paddingBottom={2}
              color="purple400"
            >
              {statusCode}
            </Text>
            {errorMessages?.title && (
              <>
                <Text variant="h1" as="h1" paddingBottom={3}>
                  {errorMessages.title}
                </Text>
                <Text variant="intro" as="div">
                  {errorMessages.body
                    ? formatBody(errorMessages.body, asPath)
                    : undefined}
                </Text>
              </>
            )}
          </Box>
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}

ErrorScreen.getProps = async ({ req }) => {
  return { statusCode: req.statusCode ?? 404 }
}

export default withMainLayout(ErrorScreen, {
  bannerProps: {
    showBanner: false,
  },
})
