import { InfluxDB, Point } from '@influxdata/influxdb-client';
import chalk from 'chalk';

interface InfluxConfig {
  url: string;
  token: string;
  org: string;
  bucket: string;
}

/**
 * InfluxDB logger class
 * Available methods:
 * - writeLog (measurement, fields, tags) - write logs to InfluxDB
 * - getLogs (measurement, timeRange) - get logs from InfluxDB
 * - queryApi - InfluxDB query API instance
 *
 * @class InfluxLogger
 * @constructor
 * @param {InfluxConfig} config - InfluxDB configuration
 */
class InfluxLogger {
  private influxDB: InfluxDB;
  private writeApi: ReturnType<InfluxDB['getWriteApi']>;
  private _queryApi: ReturnType<InfluxDB['getQueryApi']>;
  private config: InfluxConfig;

  constructor(config: InfluxConfig) {
    this.config = config;
    this.influxDB = new InfluxDB({
      url: config.url,
      token: config.token,
    });
    this.writeApi = this.influxDB.getWriteApi(config.org, config.bucket);
    this._queryApi = this.influxDB.getQueryApi(config.org);
  }

  public get queryApi(): typeof this._queryApi {
    return this._queryApi;
  }

  async writeLog(
    measurement: string,
    fields: Record<string, any>,
    tags?: Record<string, string>
  ): Promise<void> {
    try {
      const point = new Point(measurement);

      for (const [key, value] of Object.entries(fields)) {
        if (typeof value === 'number') point.floatField(key, value);
        else point.stringField(key, value.toString());
      }

      if (tags) {
        for (const [key, value] of Object.entries(tags)) {
          point.tag(key, value);
        }
      }

      this.writeApi.writePoint(point);
      await this.writeApi.flush();
      console.log(chalk.green('Data written to InfluxDB'));
    } catch (error: any) {
      console.log(chalk.red('Error writing data to InfluxDB'), error);
    }
  }

  async getLogs(measurement: string, timeRange?: string): Promise<any[]> {
    try {
      const fluxQuery = `
        from(bucket: "${this.config.bucket}")
          |> range(start: ${timeRange ?? '-30d'})
          |> filter(fn: (r) => r._measurement == "${measurement}")
          |> pivot(rowKey:["_time"], columnKey:["_field"], valueColumn: "_value")
      `;

      return await this.queryApi.collectRows(fluxQuery);
    } catch (error: any) {
      console.log(chalk.red('Error reading data from InfluxDB'), error);
      return [];
    }
  }
}

export default InfluxLogger;

const config = {
  url: process.env.INFLUX_DB_URL!,
  token: process.env.INFLUX_DB_ADMIN_TOKEN!,
  bucket: process.env.INFLUX_DB_BUCKET!,
  org: process.env.INFLUX_DB_ORGANIZATION!,
};

/**
 * InfluxDB logger instance
 * Available methods:
 * - writeLog (measurement, fields, tags) - write logs to InfluxDB
 * - getLogs (measurement, timeRange) - get logs from InfluxDB
 * - queryApi - InfluxDB query API instance
 *
 */
export const influxLogger = new InfluxLogger(config);
