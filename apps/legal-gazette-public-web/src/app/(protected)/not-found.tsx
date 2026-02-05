
import { AlertMessage, Box, Breadcrumbs } from '@dmr.is/ui/components/island-is'

export default function NotFound() {
  const breadcrumbs = [
    {
      title: 'Lögbirtingarblað',
      href: '/',
    },
    {
      title: 'Auglýsingar',
      href: '/auglysingar',
    },
    {
      title: 'Fannst ekki',
    },
  ]

  return (
    <>
      <Breadcrumbs items={breadcrumbs} />
      <Box paddingTop={4}>
        <AlertMessage
          type="error"
          title="Auglýsing fannst ekki"
          message="Auglýsingin sem þú leitaðir að fannst ekki. Hún gæti hafa verið fjarlægð eða slóðin er röng."
        />
      </Box>
    </>
  )
}
