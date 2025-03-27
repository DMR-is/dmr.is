import {
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript'

import { OfficialJournalModels } from '../constants'

/**
 * Actions that can be performed on a case
 */
export enum CaseActionEnum {
  /**
   * When case is submitted by an institution/application-system
   */
  SUBMIT = 'SUBMIT',
  /**
   * When admin assigns a case to another admin user
   */
  ASSIGN_USER = 'ASSIGN_USER',
  /**
   * When admin assigns a case to themselves
   */
  ASSIGN_SELF = 'ASSIGN_SELF',
  /**
   * When admin updates the status of the case
   */
  UPDATE_STATUS = 'UPDATE_STATUS',
  /**
   * When admin adds a comment to the case, only available for admins
   */
  COMMENT_INTERNAL = 'INTERNAL_COMMENT',
  /**
   * When admin adds external comment to the case, available for all users
   */
  COMMENT_EXTERNAL = 'EXTERNAL_COMMENT',
  /**
   * When application user adds a comment to the case, available for all users
   */
  COMMENT_APPLICATION = 'APPLICATION_COMMENT',
}

@Table({ tableName: OfficialJournalModels.CASE_ACTION, timestamps: false })
export class CaseActionModel extends Model {
  @PrimaryKey
  @Column({
    type: DataType.UUIDV4,
    defaultValue: DataType.UUIDV4,
  })
  override id!: string

  @Column({
    type: DataType.ENUM(...Object.values(CaseActionEnum)),
    allowNull: false,
  })
  title!: CaseActionEnum

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  slug!: string
}
