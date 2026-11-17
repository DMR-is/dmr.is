import { z } from 'zod'

/**
 * Hand-written from Skatturinn's PDF ("Vefþjónusta Witholding Tax"): the API
 * publishes no OpenAPI document. The PDF shows one example object and leaves
 * open which fields can be null, so everything but the kennitala, income year
 * and band is accepted as nullable. Narrow these once live responses show more.
 */

export const tokenResponseSchema = z.object({
  access_token: z.string().min(1),
  token_type: z.string().optional(),
  /**
   * Seconds. The PDF's example is 25200 (7 hours). `null` or `""` means "not
   * given" — coerced, they would be 0 and fail the whole token parse.
   */
  expires_in: z.preprocess(
    (v) => (v === null || v === '' ? undefined : v),
    z.coerce.number().positive().optional(),
  ),
})

export const JOB_COUNT_BANDS = ['25-49', '50+'] as const
export type JobCountBand = (typeof JOB_COUNT_BANDS)[number]

export const jobCountRowSchema = z.object({
  // Not `z.coerce` alone: it would read `null` as year 0.
  incomeYear: z.preprocess((v) => v ?? undefined, z.coerce.number().int()),
  companyId: z.string().regex(/^\d{10}$/),
  companyName: z.string().nullish(),
  legalAddress: z.string().nullish(),
  /** A number in the PDF (`101`), so a leading zero would be lost. */
  zipCode: z.union([z.number().int(), z.string()]).nullish(),
  cityid: z.string().nullish(),
  city: z.string().nullish(),
  isatId: z.string().nullish(),
  isatText: z.string().nullish(),
  jobCount: z.enum(JOB_COUNT_BANDS),
})

export type JobCountRow = z.infer<typeof jobCountRowSchema>

/** One company's row, with this repo's names for the fields. */
export interface WithholdingTaxJobCount {
  incomeYear: number
  nationalId: string
  name: string | null
  legalAddress: string | null
  /** Three digits, zero-padded. */
  postcode: string | null
  cityId: string | null
  city: string | null
  isatCode: string | null
  isatText: string | null
  /** Average full-time positions (ársverk) over the income year. */
  jobCountBand: JobCountBand
}

export function toJobCount(row: JobCountRow): WithholdingTaxJobCount {
  const zip = row.zipCode == null ? '' : String(row.zipCode).trim()
  return {
    incomeYear: row.incomeYear,
    nationalId: row.companyId,
    name: row.companyName ?? null,
    legalAddress: row.legalAddress ?? null,
    postcode: zip ? zip.padStart(3, '0') : null,
    cityId: row.cityid ?? null,
    city: row.city ?? null,
    isatCode: row.isatId ?? null,
    isatText: row.isatText ?? null,
    jobCountBand: row.jobCount,
  }
}
