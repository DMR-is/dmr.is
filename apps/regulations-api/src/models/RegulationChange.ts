import { Column, DataType, Model, Table } from 'sequelize-typescript';

import type { HTMLText, ISODate, PlainText } from '../routes/types';

type RegulationChangeAttributes = {
  id: number;
  regulationId: number;
  changingId: number;
  date: ISODate;
  title: PlainText;
  text: HTMLText;
  changeset: string;
};

@Table({ tableName: 'RegulationChange', timestamps: false })
export class DB_RegulationChange
  extends Model<RegulationChangeAttributes, RegulationChangeAttributes>
  implements RegulationChangeAttributes
{
  @Column({ primaryKey: true, autoIncrement: true, type: DataType.INTEGER })
  id!: number;

  @Column({
    type: DataType.INTEGER,
    comment: 'Id of the source regulation prescribing the change',
  })
  regulationId!: number;

  @Column({
    type: DataType.INTEGER,
    comment: 'Id of the target regulation being changed',
  })
  changingId!: number;

  @Column({
    type: DataType.DATEONLY,
    comment: 'The effective/publishing date of the change',
  })
  date!: ISODate;

  @Column({
    type: DataType.STRING,
    comment: 'Regulation title after applying the change',
  })
  title!: PlainText;

  @Column({
    type: DataType.STRING,
    comment: 'Regulation text after applying change',
  })
  text!: HTMLText;

  @Column({
    type: DataType.STRING,
    comment:
      'Changeset (diff) from changing regulation to the previous version of the regulation text',
  })
  changeset!: string;
}
