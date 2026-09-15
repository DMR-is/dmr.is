import { plainToInstance } from 'class-transformer'
import { validateSync,ValidationError } from 'class-validator'

import {
  SetScoringRoleStepAssignmentsDto,
  UpdateScoringRoleDto,
} from './scoring-role.dto'
import { SetScoringStepsDto } from './scoring-step.dto'
import {
  CreateScoringSubCriterionDto,
  UpdateScoringSubCriterionDto,
} from './scoring-sub-criterion.dto'

/**
 * The bounds themselves, run through the validator that actually enforces them.
 *
 * No spec in this library constructed a DTO or ran class-validator, so every
 * bound added for the scoring model — the weight range, the array sizes, the
 * PATCH optionality — was pinned by nothing but a manual check against a
 * running server. Two of them had already been got wrong in exactly the way
 * this catches: `@ApiString({ required: false })` and `@ApiNumber({ required:
 * false })` relax the published document while class-validator still demands
 * the field, so an omitted key answered 400.
 */
// Nested failures sit under `children`, not `constraints` — a helper that reads
// only the top level reports an array of invalid items as valid.
const flatten = (errors: ValidationError[]): string[] =>
  errors.flatMap((e) => [
    ...Object.values(e.constraints ?? {}),
    ...flatten(e.children ?? []),
  ])

const errorsFor = <T extends object>(
  cls: new () => T,
  payload: Record<string, unknown>,
): string[] =>
  flatten(
    validateSync(plainToInstance(cls, payload), {
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )

const ok = <T extends object>(
  cls: new () => T,
  payload: Record<string, unknown>,
) => expect(errorsFor(cls, payload)).toEqual([])

describe('sub-criterion weight bounds', () => {
  const valid = { title: 't', description: 'd', weight: 25 }

  it.each([0, 25, 100])('accepts %p', (weight) => {
    ok(CreateScoringSubCriterionDto, { ...valid, weight })
  })

  // The one that reached filed scores: 60 + 60 - 20 sums to 100, so every
  // rule that checks only the total passed while the negative weight inverted
  // its own sub-criterion's scale.
  it('refuses a negative weight', () => {
    expect(errorsFor(CreateScoringSubCriterionDto, { ...valid, weight: -20 })
      .join(' ')).toMatch(/must not be less than 0/)
  })

  it('refuses a weight over 100', () => {
    expect(errorsFor(CreateScoringSubCriterionDto, { ...valid, weight: 140 })
      .join(' ')).toMatch(/must not be greater than 100/)
  })

  it('applies the same bounds on the PATCH', () => {
    expect(errorsFor(UpdateScoringSubCriterionDto, { weight: -1 })).not.toEqual(
      [],
    )
    ok(UpdateScoringSubCriterionDto, { weight: 30 })
  })

  // PATCH semantics: every key optional, so an omitted one is left alone. This
  // is the assertion that would have caught `required: false`.
  it('accepts an empty PATCH body', () => {
    ok(UpdateScoringSubCriterionDto, {})
  })
})

describe('scale length', () => {
  const steps = (n: number) =>
    Array.from({ length: n }, (_, i) => ({ description: `þrep ${i + 1}` }))

  it.each([2, 5, 8])('accepts a scale of %i þrep', (n) => {
    ok(SetScoringStepsDto, { steps: steps(n) })
  })

  it.each([0, 1])('refuses a scale of %i þrep', (n) => {
    expect(errorsFor(SetScoringStepsDto, { steps: steps(n) }).join(' ')).toMatch(
      /at least 2 elements/,
    )
  })

  it('refuses a scale longer than the filing allows', () => {
    expect(errorsFor(SetScoringStepsDto, { steps: steps(9) }).join(' ')).toMatch(
      /no more than 8 elements/,
    )
  })
})

describe('role DTOs', () => {
  it('accepts an empty PATCH body', () => {
    ok(UpdateScoringRoleDto, {})
  })

  it('accepts clearing a job’s assignments', () => {
    ok(SetScoringRoleStepAssignmentsDto, { assignments: [] })
  })

  it('refuses an assignment whose ids are not uuids', () => {
    expect(
      errorsFor(SetScoringRoleStepAssignmentsDto, {
        assignments: [{ subCriterionId: 'nope', stepId: 'nope' }],
      }),
    ).not.toEqual([])
  })
})
