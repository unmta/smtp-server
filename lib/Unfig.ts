import { readFileSync } from 'fs';
import toml from 'toml';
import { initializeLogger, logger } from './';

const unfigToml = toml.parse(readFileSync('unfig.toml', 'utf-8'));
const tlsCert = unfigToml.tls.cert ? readFileSync(unfigToml.tls.cert) : null;
const tlsKey = unfigToml.tls.key ? readFileSync(unfigToml.tls.key) : null;

type SmtpUnfig = {
  port: number;
  listen: string;
  hostname: string | undefined;
};
type AuthUnfig = {
  enable: boolean;
  requireTLS: boolean;
};
type TlsUnfig = {
  enableStartTLS: boolean;
  key: Buffer | null;
  cert: Buffer | null;
};
type LogUnfig = {
  level: 'error' | 'warn' | 'info' | 'debug' | 'smtp';
};

class Unfig {
  smtp: SmtpUnfig;
  auth: AuthUnfig;
  tls: TlsUnfig;
  log: LogUnfig;

  constructor() {
    this.smtp = {
      port: unfigToml.smtp.port || 2525,
      listen: unfigToml.smtp.listen || 'localhost',
      hostname: unfigToml.smtp.hostname,
    };
    this.auth = {
      enable: unfigToml.auth.enable || false,
      requireTLS: unfigToml.auth.requireTLS ?? true,
    };
    this.tls = {
      enableStartTLS: unfigToml.tls.enableStartTLS || false,
      key: tlsKey,
      cert: tlsCert,
    };
    this.log = {
      level: unfigToml.log.level || 'info',
    };
  }
}

export const unfig = new Unfig();
initializeLogger(unfig.log.level); // Now that we have the log level, initialize the logger
logger.info('Unfig (config) loaded');
logger.info(`Logger initialized. Level: '${unfig.log.level}'`);
