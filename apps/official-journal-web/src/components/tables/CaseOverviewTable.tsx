import { Icon, Table as T } from '@island.is/island-ui/core'

export const CaseOverviewTable = () => {
  return (
    <T.Table>
      <T.Head>
        <T.HeadData></T.HeadData>
        <T.HeadData>Birting</T.HeadData>
        <T.HeadData>Skráning</T.HeadData>
        <T.HeadData>Deild</T.HeadData>
        <T.HeadData>Heiti</T.HeadData>
      </T.Head>
      <T.Body>
        <T.Row>
          <T.Data>{/* <Icon icon="timer" /> */}</T.Data>
          <T.Data>06.12.2023</T.Data>
          <T.Data>01.12.2023</T.Data>
          <T.Data>B-Deild</T.Data>
          <T.Data>GJALDSKRÁ fyrir hundahald í Reykjavíkurborg.</T.Data>
        </T.Row>
      </T.Body>
    </T.Table>
  )
}
