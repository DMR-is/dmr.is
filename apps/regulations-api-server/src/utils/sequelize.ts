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
    dialect: 'mysql',
    host: process.env.MYSQL_HOST,
    port: parseInt(process.env.MYSQL_PORT ?? ''),
    username: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASS,
    database: process.env.MYSQL_DB,
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
    // Options passed down to the `mysql2` driver
    pool: {
      max: Number(process.env.DATABASE_CONNECTION_LIMIT) || 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  });

  return db;
};
