/* eslint-env node */
module.exports = {
  development: {
    username: process.env.DB_USER || 'dev_db',
    password: process.env.DB_PASS || 'dev_db',
    database: process.env.DB_NAME || 'dev_db_official_journal',
    host: 'localhost',
    port: '5432',
    dialect: 'postgres',
  },
  test: {
    username: process.env.DB_USER || 'dev_db',
    password: process.env.DB_PASS || 'dev_db',
    database: process.env.DB_NAME || 'dev_db_official_journal',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    dialect: 'postgres',
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: 'postgres',
  },
}
