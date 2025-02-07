import { Column, DataType, Model, Table } from 'sequelize-typescript';

import type { LawChapterSlug } from '../routes/types';

type LawChapterAttributes = {
  id: number;
  slug: LawChapterSlug;
  title: string;
  parentId?: number;
};

@Table({ tableName: 'LawChapter', timestamps: false })
export class DB_LawChapter
  extends Model<LawChapterAttributes, LawChapterAttributes>
  implements LawChapterAttributes
{
  @Column({ primaryKey: true, autoIncrement: true, type: DataType.INTEGER })
  id!: number;

  @Column({ type: DataType.STRING(8) })
  slug!: LawChapterSlug;

  @Column({ type: DataType.STRING(256) })
  title!: string;

  @Column({ allowNull: true, type: DataType.INTEGER })
  parentId?: number;
}
