import { Column, DataType, Model, Table } from 'sequelize-typescript';

type TaskAttributes = {
  id: number;
  regulationId: number;
  done: boolean;
  migrated: boolean;
  lastEdited: Date;
};

@Table({ tableName: 'Task', timestamps: false })
export class DB_Task
  extends Model<TaskAttributes, TaskAttributes>
  implements TaskAttributes
{
  @Column({ primaryKey: true, autoIncrement: true, type: DataType.INTEGER })
  id!: number;

  @Column({ type: DataType.INTEGER })
  regulationId!: number;

  @Column({ type: DataType.BOOLEAN })
  done!: boolean;

  @Column({ type: DataType.BOOLEAN })
  migrated!: boolean;

  @Column({ type: DataType.DATE })
  lastEdited!: Date;
}
