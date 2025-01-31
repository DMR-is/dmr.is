import { Column, DataType, Model, Table } from 'sequelize-typescript';

import type { HTMLText, ISODate, PlainText, RegName } from '../routes/types';

type RegulationAttributes = {
  id: number;
  title: string;
  name: RegName;
  text: HTMLText;
  signatureDate: ISODate;
  publishedDate: ISODate;
  effectiveDate: ISODate;
  updateComment?: string;
  status: 'draft' | 'text_locked' | 'migrated';
  type?: 'base' | 'amending';
  ministryId?: number;
  originalDoc?: string;
};

@Table({ tableName: 'Regulation', timestamps: false })
export class DB_Regulation
  extends Model<RegulationAttributes, RegulationAttributes>
  implements RegulationAttributes
{
  @Column({
    primaryKey: true,
    autoIncrement: true,
    type: DataType.INTEGER,
    comment: 'Migrated as-is from old Eplica database',
  })
  id!: number;

  @Column({
    type: DataType.STRING,
    comment: 'The original title of the regulation (text/plain)',
  })
  title!: PlainText;

  @Column({
    type: DataType.STRING(9),
    comment:
      'The publication number/year of the regulation (Normalized format "NNNN/YYYY")',
  })
  name!: RegName;

  @Column({
    type: DataType.STRING,
    comment:
      'The original text body of the regulation (including appendix chapters and "comments from the editor") (text/html)',
  })
  text!: HTMLText;

  @Column({
    type: DataType.DATEONLY,
    comment:
      'Date of physical/official signature by the minister and/or other officials',
  })
  signatureDate!: ISODate;

  @Column({
    type: DataType.DATEONLY,
    comment: 'Official date of publication in Stjórnartíðindi',
  })
  publishedDate!: ISODate;

  @Column({
    type: DataType.DATEONLY,
    comment: 'NOTE: This date is for informational purposes only',
  })
  effectiveDate!: ISODate;

  @Column({
    type: DataType.ENUM('draft', 'text_locked', 'migrated'),
    comment: 'Status of regulation after manual processing',
  })
  status!: 'draft' | 'text_locked' | 'migrated';

  @Column({
    type: DataType.ENUM('base', 'amending'),
    comment:
      'Type of regulation, base (stofn) or amending (breytingar), base can still amend tho.',
  })
  type!: 'base' | 'amending';

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: 'The ministry this Regulation belongs to currently',
  })
  ministryId?: number;

  @Column({ type: DataType.BOOLEAN })
  repealedBeacuseReasons!: boolean;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    comment:
      "URL of the official/original PDF version in Stjórnartíðindi's document store (mostly relevant for older regluations)",
  })
  originalDoc?: string;
}
