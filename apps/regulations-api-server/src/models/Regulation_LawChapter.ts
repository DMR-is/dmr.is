import { Column, DataType, Model, Table } from 'sequelize-typescript';

type Regulation_LawChapterAttributes = {
  id: number;
  regulationId: number;
  chapterId: number;
};

@Table({ tableName: 'Regulation_LawChapter', timestamps: false })
export class DB_Regulation_LawChapter
  extends Model<
    Regulation_LawChapterAttributes,
    Regulation_LawChapterAttributes
  >
  implements Regulation_LawChapterAttributes
{
  @Column({ primaryKey: true, autoIncrement: true, type: DataType.INTEGER })
  id!: number;

  @Column({ type: DataType.INTEGER })
  regulationId!: number;

  @Column({ type: DataType.INTEGER })
  chapterId!: number;
}
