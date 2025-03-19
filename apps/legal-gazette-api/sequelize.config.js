/* eslint-env node */
module.exports = {
  development: {
    username: process.env.DB_USER || 'dev_db',
    password: process.env.DB_PASS || 'dev_db',
    database: process.env.DB_NAME || 'dev_db_legal_gazette',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || '5434',
    dialect: 'postgres',
  },
  test: {
    username: process.env.DB_USER || 'test_db',
    password: process.env.DB_PASS || 'test_db',
    database: process.env.DB_NAME || 'test_db',
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
