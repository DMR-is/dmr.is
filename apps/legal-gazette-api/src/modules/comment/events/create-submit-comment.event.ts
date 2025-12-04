export class CreateSubmitCommentEvent {
  advertId!: string
  statusId!: string
  actorId!: string
  external?: boolean
  actorName?: string
}

export class CreateStatusChangeCommentEvent {
  advertId!: string
  actorId!: string
  statusId!: string
}
