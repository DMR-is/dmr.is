import { Footer, Header } from '@island.is/island-ui/core'

type Props = {
  children?: React.ReactNode
}

export const Layout = ({ children }: Props) => {
  return (
    <>
      <Header
        info={{
          title: 'Stjórnartíðindi',
          description: 'Allar auglýgngar Íslands',
        }}
        logoRender={(logo) => <a href="/minarsidur/umsoknir">{logo}</a>}
      />
      {children}
      <Footer />
    </>
  )
}
