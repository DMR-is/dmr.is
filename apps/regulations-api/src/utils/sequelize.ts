import { Sequelize } from 'sequelize-typescript';

import { DB_LawChapter } from '../models/LawChapter';
import { DB_Ministry } from '../models/Ministry';
import { DB_Regulation } from '../models/Regulation';
import { DB_Regulation_LawChapter } from '../models/Regulation_LawChapter';
import { DB_RegulationCancel } from '../models/RegulationCancel';
import { DB_RegulationChange } from '../models/RegulationChange';
import { DB_Task } from '../models/Task';

export let db: Sequelize;

export const connectSequelize = async () => {
  db = await new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT ?? ''),
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    storage: ':memory:',
    logging: process.env.DATABASE_QUERY_LOGGING === 'true',
    models: [
      DB_Regulation,
      DB_Ministry,
      DB_LawChapter,
      DB_RegulationChange,
      DB_RegulationCancel,
      DB_Regulation_LawChapter,
      DB_Task,
    ],
  });

  return db;
};
