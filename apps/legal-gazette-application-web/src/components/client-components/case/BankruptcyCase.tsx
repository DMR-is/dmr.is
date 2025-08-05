import { CaseDto } from '../../../gen/fetch'

type Props = {
  case: CaseDto
}

export const BankruptcyCase = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Þrotabú</h1>
      <p className="mb-4">Hér getur þú séð upplýsingar um þrotabúið.</p>
      {/* Render case details here */}
    </div>
  )
}
