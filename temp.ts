import InfluxLogger from './src/utils/influxDB';

const config = {
  url: process.env.INFLUX_DB_URL!,
  token: process.env.INFLUX_DB_ADMIN_TOKEN!,
  bucket: process.env.INFLUX_DB_BUCKET!,
  org: process.env.INFLUX_DB_ORGANIZATION!,
};

const logger = new InfluxLogger(config);

// Log 1
await logger.writeLog(
  'application_logs',
  { message: 'User login successful', status: 'ok' },
  { level: 'info', service: 'auth_service', host: 'server1' }
);

// Log 2
await logger.writeLog(
  'application_logs',
  {
    message: 'redis cache error',
    error_code: 500,
  },
  { level: 'error', service: 'cache_service', host: 'server2' }
);

// Log 3
await logger.writeLog(
  'application_logs',
  { message: 'Payment successful', amount: 430.4994 },
  { level: 'info', service: 'payment_service', host: 'server1' }
);

const logs = await logger.getLogs('application_logs', '-1d');

console.log(logs);
