import { ArrayMaxSize, ArrayMinSize } from 'class-validator'

import { ApiDtoArray, ApiString } from '@dmr.is/decorators'

import { MAX_STEPS, MIN_STEPS } from '../../report-excel/workbook.schema'

export class SetScoringStepDto {
  @ApiString({
    minLength: 1,
    description:
      'What this step means, in the employer’s words — the text a reviewer reads beside the score. Its position in the array is its þrep number; there is no order field to set.',
    example: '1–5 undirmenn',
  })
  description!: string
}

/**
 * A scale is written whole, never a step at a time.
 *
 * Two reasons, both structural. A þrep's score is
 * `(stepOrder / numSteps) x weight x SCORE_FACTOR`, so the orders have to be
 * contiguous from 1 — and a caller adding or removing one step at a time
 * necessarily passes through states where they are not, with no single call
 * available to fix it. And a scale has a minimum length, so the first step of a
 * new scale would always be invalid on its own.
 *
 * Taking the array whole makes both impossible rather than merely detected:
 * order comes from position, so it cannot have gaps, and the length is checked
 * once against the same bounds the filing enforces.
 */
export class SetScoringStepsDto {
  // `MIN_STEPS`/`MAX_STEPS` were imported here only to interpolate into the
  // description below, so the published contract promised a bound nothing
  // enforced: `ApiDtoArray` applies no size validator and `setSteps` checked no
  // length. Under the body limit one request could insert hundreds of thousands
  // of þrep onto a single sub-criterion — and `deleteModel` loads the tree
  // before destroying it, so the only cleanup path had to read what it could
  // not read.
  @ArrayMinSize(MIN_STEPS)
  @ArrayMaxSize(MAX_STEPS)
  @ApiDtoArray(SetScoringStepDto, {
    description: [
      `The complete scale, in order, from step 1. Between ${MIN_STEPS} and ${MAX_STEPS} entries — the same bounds a filing enforces, so a scale that is accepted here cannot be refused there for its length.`,
      '',
      'Replaces whatever the sub-criterion had. **Any role step assignment onto the old scale goes with it**, and the model then reports that job as missing an assignment until it is set again — dropped visibly rather than silently re-homed onto a step the caller did not choose.',
    ].join('\n'),
    example: [
      { description: 'Enginn mannaforráð' },
      { description: '1–5 undirmenn' },
      { description: '6+ undirmenn' },
    ],
  })
  steps!: SetScoringStepDto[]
}
