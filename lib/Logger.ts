// logger.ts
import { createLogger, format, transports, addColors } from 'winston';

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

// Create the logger instance
const logger = createLogger({
  levels: customLevels.levels,
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.colorize({ all: true }),
    format.printf(({ timestamp, level, message }) => `${timestamp} [${level}]: ${message}`)
  ),
  transports: [
    // Log to the console
    new transports.Console({
      level: 'smtp', // Set the console log level
    }),

    // // Log to a file
    // new transports.File({
    //   filename: 'logs/app.log',
    //   level: 'info', // Set the file log level
    //   format: format.combine(
    //     format.uncolorize(), // Remove color codes for the file output
    //     format.json() // Save logs as JSON in the file
    //   ),
    // }),
  ],
});

// Set colorization for the custom log levels
addColors(customLevels.colors);

export default logger;
