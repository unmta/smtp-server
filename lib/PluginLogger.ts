import { Logger } from 'winston';

// A wrapper around the Winston logger to provide a plugin-specific log method
export default class PluginLogger {
  private logger: Logger;
  private pluginName: string;

  constructor(logger: Logger, pluginName: string) {
    this.logger = logger;
    this.pluginName = pluginName;
  }

  private log(level: string, message: string): void {
    this.logger.log(level, `[${this.pluginName}] ${message}`);
  }

  public error(message: string): void {
    this.log('error', message);
  }

  public warn(message: string): void {
    this.log('warn', message);
  }

  public info(message: string): void {
    this.log('info', message);
  }

  public debug(message: string): void {
    this.log('debug', message);
  }

  public smtp(message: string): void {
    this.log('smtp', message);
  }
}
