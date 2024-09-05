// winston.d.ts
import 'winston';

// Extend the Winston module to include the custom 'smtp' level
declare module 'winston' {
  interface Logger {
    smtp: (message: string, ...meta: any[]) => Logger;
  }
}
