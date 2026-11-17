/**
 * Live check of Skatturinn's WithholdingTaxApi through the real client and
 * Nest DI.
 *
 *   yarn nx run directorate-of-equality-api:withholding-tax-check -- 2025
 *
 * Needs RSK_WITHHOLDING_TAX_API_PATH, _USERNAME and _PASSWORD in the env.
 * Prints counts and field coverage only — never a kennitala, a name or any
 * other company value — so the output is safe to paste into a PR or a chat.
 */
import { Module } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'

import {
  isWithholdingTaxError,
  IWithholdingTaxService,
  JOB_COUNT_BANDS,
  type WithholdingTaxJobCount,
  WithholdingTaxModule,
} from '@dmr.is/clients-withholding-tax'
import { LoggingModule } from '@dmr.is/logging'

@Module({ imports: [LoggingModule, WithholdingTaxModule] })
class WithholdingTaxCheckModule {}

const out = (line = '') => process.stdout.write(`${line}\n`)

async function main() {
  const incomeYear = Number(process.argv[2] ?? new Date().getFullYear() - 1)
  const app = await NestFactory.createApplicationContext(
    WithholdingTaxCheckModule,
    { logger: false },
  )
  try {
    const service = app.get<IWithholdingTaxService>(IWithholdingTaxService)

    await service.checkConnection()
    out('token: ok')

    const started = Date.now()
    const result = await service.getJobCounts(incomeYear)
    out(`GetJobCount/${incomeYear}: ${Date.now() - started} ms`)
    out(`accepted: ${result.companies.length}`)
    out(`skipped:  ${result.skipped.length}`)
    for (const s of result.skipped.slice(0, 10)) {
      out(`  row ${s.index}: ${s.issues.join(', ')}`)
    }

    out()
    out('by band:')
    for (const band of JOB_COUNT_BANDS) {
      const n = result.companies.filter((c) => c.jobCountBand === band).length
      out(`  ${band.padEnd(6)} ${n}`)
    }

    const years = new Set(result.companies.map((c) => c.incomeYear))
    out()
    out(`incomeYear values: ${[...years].join(', ') || '(none)'}`)
    const ids = new Set(result.companies.map((c) => c.nationalId))
    out(`distinct kennitölur: ${ids.size}`)

    out()
    out('null per field:')
    const fields: (keyof WithholdingTaxJobCount)[] = [
      'name',
      'legalAddress',
      'postcode',
      'cityId',
      'city',
      'isatCode',
      'isatText',
    ]
    for (const field of fields) {
      const n = result.companies.filter((c) => c[field] === null).length
      out(`  ${field.padEnd(13)} ${n}`)
    }
  } finally {
    await app.close()
  }
}

main().catch((error) => {
  out(
    isWithholdingTaxError(error)
      ? `failed: ${error.reason} (${error.operation}${error.status ? `, HTTP ${error.status}` : ''}): ${error.message}`
      : `failed: ${error instanceof Error ? error.message : String(error)}`,
  )
  process.exitCode = 1
})
