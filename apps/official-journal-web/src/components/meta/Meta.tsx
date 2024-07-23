import Head from 'next/head'

export const Meta = ({
  title,
  description,
}: {
  title: string
  description?: string
}) => {
  return (
    <Head>
      <title key="title">{title}</title>
      {description ? (
        <meta name="description" content={description} key="desc" />
      ) : null}
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1, shrink-to-fit=no"
        key="viewport"
      />
    </Head>
  )
}
