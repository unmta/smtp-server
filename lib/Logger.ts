import { createLogger, format, transports, addColors, Logger } from 'winston';

// Define custom log levels
const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
    smtp: 4, // Logs smtp chatter
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    debug: 'magenta',
    smtp: 'cyan', // Color for the custom 'smtp' level
  },
};

let logger: Logger;
// We initialize the logger from Unfig, after unfig has loaded
export function initializeLogger(logLevel: string) {
  logger = createLogger({
    levels: customLevels.levels,
    format: format.combine(
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      format.colorize({ all: true }),
      format.printf(({ timestamp, level, message }) => `${timestamp} [${level}]: ${message}`)
    ),
    transports: [
      // Log to the console
      new transports.Console({
        level: logLevel, // Set the console log level
      }),
    ],
  });
  addColors(customLevels.colors);
}

export { logger };
