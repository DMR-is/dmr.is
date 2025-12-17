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

export class CreateUserAssignedCommentEvent {
  advertId!: string
  actorId!: string
  receiverId!: string
}
