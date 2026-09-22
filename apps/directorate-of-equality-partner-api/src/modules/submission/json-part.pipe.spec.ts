import { plainToInstance } from 'class-transformer'
import { IsInt, IsString } from 'class-validator'

import { ArgumentMetadata, BadRequestException } from '@nestjs/common'

import { SubmitPartnerEqualityReportDto } from '@dmr.is/doe-modules/application'

import { JsonPartPipe } from './json-part.pipe'

class ExampleDto {
  @IsString()
  providerId!: string

  @IsInt()
  employeeCount!: number
}

const META: ArgumentMetadata = { type: 'body' }

/**
 * The guarantee under test is not "this parses JSON". It is that the JSON part
 * of a multipart submission is validated by the SAME rules as a JSON request
 * body on every other route here.
 *
 * That matters because the global `ValidationPipe` sees this part as a
 * `String`. Without the pipe, a multipart submission would accept bodies the
 * JSON routes reject — "previews clean, rejected at submit" for a fourth time,
 * in the phase whose plan called that out as the thing not to add. The pipe
 * therefore owns no validation of its own; it delegates to a real
 * `ValidationPipe` built from the options `bootstrap` gives the global one, and
 * these tests pin that the delegation actually happens.
 */
describe('JsonPartPipe', () => {
  const pipe = new JsonPartPipe(ExampleDto, 'payload')

  const valid = JSON.stringify({ providerId: 'p-1', employeeCount: 12 })

  it('parses and returns an instance of the target type', async () => {
    await expect(pipe.transform(valid, META)).resolves.toBeInstanceOf(
      ExampleDto,
    )
  })

  it('applies the transform, so a JSON number stays a number', async () => {
    const result = (await pipe.transform(valid, META)) as ExampleDto

    expect(result.employeeCount).toBe(12)
  })

  /**
   * `forbidNonWhitelisted` is the option a public surface leans on hardest: a
   * vendor misspelling a field must be told, not silently filed without it.
   * If the pipe built its own `ValidationPipe`, this is the assertion that
   * would fail the day the two configurations drifted.
   */
  it('refuses an unknown field, exactly as a JSON body would', async () => {
    const body = JSON.stringify({
      providerId: 'p-1',
      employeeCount: 12,
      equalityReportContent: '<p>the field this channel removed</p>',
    })

    // Asserted on the response payload, not `error.message` — Nest's
    // `BadRequestException` carries the per-field messages there and leaves
    // `message` as the generic "Bad Request Exception".
    await expect(pipe.transform(body, META)).rejects.toMatchObject({
      response: {
        message: expect.arrayContaining([
          expect.stringContaining('equalityReportContent'),
        ]),
      },
    })
  })

  it('refuses a payload that fails the DTO rules', async () => {
    const body = JSON.stringify({ providerId: 'p-1', employeeCount: 'twelve' })

    await expect(pipe.transform(body, META)).rejects.toThrow(
      BadRequestException,
    )
  })

  describe('the part itself', () => {
    it.each([
      ['missing', undefined],
      ['empty', ''],
      ['whitespace only', '   '],
    ])('refuses a %s part, naming it', async (_case, value) => {
      await expect(pipe.transform(value, META)).rejects.toThrow(/"payload"/)
    })

    it('refuses text that is not JSON', async () => {
      await expect(pipe.transform('not json at all', META)).rejects.toThrow(
        /not valid JSON/,
      )
    })

    /**
     * Without this, `JSON.parse` succeeds and class-validator is handed a
     * primitive or an array — which validates as an empty object and files a
     * report with every field absent.
     */
    it.each([
      ['an array', '[]'],
      ['a bare string', '"p-1"'],
      ['a number', '42'],
      ['null', 'null'],
    ])(
      'refuses %s, which is valid JSON but not an object',
      async (_c, body) => {
        await expect(pipe.transform(body, META)).rejects.toThrow(
          /must be a JSON object/,
        )
      },
    )

    it('does not leak the parser’s own wording', async () => {
      await expect(pipe.transform('{oops', META)).rejects.not.toThrow(
        /position|token|JSON\.parse/i,
      )
    })
  })

  it('agrees with a plain JSON body on the same input', async () => {
    const throughPipe = (await pipe.transform(valid, META)) as ExampleDto
    const throughBody = plainToInstance(ExampleDto, JSON.parse(valid))

    expect({ ...throughPipe }).toEqual({ ...throughBody })
  })

  /**
   * The cases above use a local DTO to test the pipe's own mechanics. This one
   * uses the class the route actually binds, because the contract it enforces is
   * the point of the phase: the plan arrives as a document, so there is no
   * content field left to send. A vendor still sending markup is told, rather
   * than having it silently dropped and a report filed with no plan in it.
   */
  describe('against the real partner equality DTO', () => {
    const realPipe = new JsonPartPipe(SubmitPartnerEqualityReportDto, 'payload')

    it.each([
      'equalityReportContent',
      'equalityReportPdf',
      'equalityReportPdfFilename',
    ])('refuses %s — the document part is the only way in', async (field) => {
      const body = JSON.stringify({ providerId: 'p-1', [field]: 'x' })

      await expect(realPipe.transform(body, META)).rejects.toMatchObject({
        response: {
          message: expect.arrayContaining([expect.stringContaining(field)]),
        },
      })
    })
  })
})
