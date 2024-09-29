import { existsSync, readFileSync } from 'fs';
import { hostname } from 'os';
import toml from 'toml';
import { initializeLogger, logger, type SmtpPlugin } from './';

const unfigToml = existsSync('config/unfig.toml') ? toml.parse(readFileSync('config/unfig.toml', 'utf-8')) : {};
const tlsCert = unfigToml.tls?.cert ? readFileSync(unfigToml.tls.cert) : null;
const tlsKey = unfigToml.tls?.key ? readFileSync(unfigToml.tls.key) : null;

type SmtpUnfig = {
  port: number;
  listen: string;
  hostname: string | undefined;
  inactivityTimeout: number;
  gracefulStopTimeout: number;
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

export class Unfig {
  public readonly smtp: Readonly<SmtpUnfig>;
  public readonly auth: Readonly<AuthUnfig>;
  public readonly tls: Readonly<TlsUnfig>;
  public readonly log: Readonly<LogUnfig>;
  public readonly plugins: { [key: string]: any };

  constructor() {
    this.smtp = {
      port: unfigToml.smtp?.port || 2525,
      listen: unfigToml.smtp?.listen || 'localhost',
      hostname: unfigToml.smtp?.hostname || hostname().toLowerCase(),
      inactivityTimeout: unfigToml.smtp?.inactivityTimeout || 300,
      gracefulStopTimeout: unfigToml.smtp?.gracefulStopTimeout || 300,
    };
    this.auth = {
      enable: unfigToml.auth?.enable || false,
      requireTLS: unfigToml.auth?.requireTLS ?? true,
    };
    this.tls = {
      enableStartTLS: unfigToml.tls?.enableStartTLS || false,
      key: tlsKey,
      cert: tlsCert,
    };
    this.log = {
      level: unfigToml.log?.level || 'info',
    };
    this.plugins = unfigToml.plugins || {};
  }

  // Load default plugin configuration and merge with the config file, if any
  public loadPluginConfig(plugin: Partial<SmtpPlugin>) {
    let defaultConfig = {};
    if (plugin.defaultConfig) {
      defaultConfig = plugin.defaultConfig;
    }
    if (existsSync(`config/${plugin.constructor.name}.toml`)) {
      // Load config from config/PluginName.toml, if it exists
      const pluginConfig = toml.parse(readFileSync(`config/${plugin.constructor.name}.toml`, 'utf-8'));
      unfig.plugins[plugin.constructor.name] = { ...defaultConfig, ...pluginConfig };
    } else if (unfig.plugins[plugin.constructor.name]) {
      // If the plugin is defined in the unfig.toml file, merge with the default config
      unfig.plugins[plugin.constructor.name] = { ...defaultConfig, ...unfig.plugins[plugin.constructor.name] };
    } else {
      // Otherwise no custom config set, use default
      unfig.plugins[plugin.constructor.name] = defaultConfig;
    }
  }
}

export const unfig = new Unfig();
initializeLogger(unfig.log.level); // Now that we have the log level, initialize the logger
logger.info('Unfig (config) loaded');
logger.info(`Logger initialized. Level: '${unfig.log.level}'`);
