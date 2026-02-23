import { useIssues } from "../../hooks/issues/useIssues"

export default function IssuesPage() {

const { issues } = useIssues()

  return (
    <div>
      <h1>Hefti</h1>
    </div>
  )
}

export async function getServerSideProps() {
  return {}
}
