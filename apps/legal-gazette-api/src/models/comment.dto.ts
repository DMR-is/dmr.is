// `CommentDto` lives outside `comment.model.ts` on purpose.
//
// `@ApiProperty({ type: StatusDto })` reads its argument eagerly, at
// class-decoration time, and `status.model.ts` reaches `comment.model.ts` back
// through `advert.model.ts`. Declaring the DTO in the model file therefore put
// that read inside a cycle: entering the graph via `status.model` threw
// `Cannot access 'StatusDto' before initialization`. See `models.md`.
import { ApiProperty, PickType } from '@nestjs/swagger'

import { ApiDateTime } from '@dmr.is/decorators'

import { CommentModel } from './comment.model'
import { StatusDto } from './status.model'

export class CommentDto extends PickType(CommentModel, [
  'id',
  'type',
  'advertId',
  'actor',
  'receiver',
  'comment',
] as const) {
  @ApiProperty({ type: StatusDto })
  status!: StatusDto

  @ApiDateTime()
  createdAt!: Date
}
