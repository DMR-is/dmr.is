export function getEnv() {
  const {
    NODE_ENV: nodeEnv = 'development',
    MSSQL_CONNECTION_STRING: mssqlConnectionString,
  } = process.env

  if (!mssqlConnectionString) {
    throw new Error('MSSQL_CONNECTION_STRING is required')
  }

  return {
    nodeEnv,
    mssqlConnectionString,
  }
}
