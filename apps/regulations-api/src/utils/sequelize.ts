import pg from 'pg'
import { Sequelize } from 'sequelize-typescript'

import { DB_LawChapter } from '../models/LawChapter'
import { DB_Ministry } from '../models/Ministry'
import { DB_Regulation } from '../models/Regulation'
import { DB_Regulation_LawChapter } from '../models/Regulation_LawChapter'
import { DB_RegulationCancel } from '../models/RegulationCancel'
import { DB_RegulationChange } from '../models/RegulationChange'
import { DB_Task } from '../models/Task'

export let db: Sequelize

export const connectSequelize = async () => {
  const port = process.env.REGULATION_DB_PORT
    ? parseInt(process.env.REGULATION_DB_PORT)
    : 5432
  db = new Sequelize({
    dialect: 'postgres',
    host: process.env.REGULATION_REG_DB_HOST,
    port,
    dialectModule: pg,
    username: process.env.REGULATION_DB_USER,
    password: process.env.REGULATION_DB_PASSWORD,
    database: process.env.REGULATION_DB_NAME,
    storage: ':memory:',
    logging: process.env.DATABASE_QUERY_LOGGING === 'true',
    quoteIdentifiers: false,
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
  })

  return db
}
