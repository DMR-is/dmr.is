import dynamic from 'next/dynamic'


const PageContainer = dynamic(
  () =>
    import('../../components/client-components/ritstjorn/PageContainer').then(
      (mod) => mod.PageContainer,
    ),
  {
    ssr: false,
  },
)

export default async function Ritstjorn(props: {
  searchParams: {
    tab: string
    [key: string]: string | string[] | undefined
  }
}) {
  const { searchParams } = props

  return <PageContainer searchParams={searchParams} />
}
