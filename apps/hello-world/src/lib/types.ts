import { GetServerSidePropsContext } from 'next'
import React from 'react'

export type ScreenContext = {
  query: GetServerSidePropsContext['query']
  req: GetServerSidePropsContext['req']
  res: GetServerSidePropsContext['res']
}

export type Screen<Props = {}> = React.ComponentType<Props> & {
  getProps?: (ctx: ScreenContext) => Promise<any>
}
