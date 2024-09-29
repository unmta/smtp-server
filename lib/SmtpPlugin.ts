import { Logger } from 'winston';
import { PluginLogger, SmtpCommand, SmtpContext, SmtpSession, SmtpPluginSession, EnvelopeAddress, logger, unfig } from '.';
import type {
  ConnectAccept,
  ConnectDefer,
  ConnectReject,
  AuthAccept,
  AuthDefer,
  AuthReject,
  HeloAccept,
  HeloDefer,
  HeloReject,
  MailFromAccept,
  MailFromDefer,
  MailFromReject,
  RcptToAccept,
  RcptToDefer,
  RcptToReject,
  DataStartAccept,
  DataStartDefer,
  DataStartReject,
  DataEndAccept,
  DataEndDefer,
  DataEndReject,
  QuitAccept,
  QuitDefer,
  QuitReject,
  RsetAccept,
  RsetDefer,
  RsetReject,
  HelpAccept,
  HelpDefer,
  HelpReject,
  NoopAccept,
  NoopDefer,
  NoopReject,
  VrfyAccept,
  VrfyDefer,
  VrfyReject,
  UnknownAccept,
  UnknownDefer,
  UnknownReject,
  Unfig,
} from '.';

export abstract class SmtpPlugin {
  defaultConfig?: Record<string, any>;

  private _logger: PluginLogger;
  private _unfig: Unfig;

  constructor(logger: Logger, unfig: Unfig) {
    this._logger = new PluginLogger(this.constructor.name, logger);
    this._unfig = unfig;
  }

  get logger() {
    return this._logger;
  }

  get unfig() {
    return this._unfig;
  }

  get context() {
    return SmtpContext.getInstance();
  }

  onServerStart?(): void;
  onServerStop?(): void;
  onConnect?(session: SmtpPluginSession): Promise<void | ConnectAccept | ConnectDefer | ConnectReject> | void | ConnectAccept | ConnectDefer | ConnectReject;
  onHelo?(
    session: SmtpPluginSession,
    hostname: string,
    verb: 'HELO' | 'EHLO'
  ): Promise<void | HeloAccept | HeloDefer | HeloReject> | void | HeloAccept | HeloDefer | HeloReject;
  onAuth?(
    session: SmtpPluginSession,
    username: string,
    password: string
  ): Promise<void | AuthAccept | AuthDefer | AuthReject> | void | AuthAccept | AuthDefer | AuthReject;
  onMailFrom?(
    session: SmtpPluginSession,
    address: EnvelopeAddress,
    command: SmtpCommand
  ): Promise<void | MailFromAccept | MailFromDefer | MailFromReject> | void | MailFromAccept | MailFromDefer | MailFromReject;
  onRcptTo?(
    session: SmtpPluginSession,
    address: EnvelopeAddress,
    command: SmtpCommand
  ): Promise<void | RcptToAccept | RcptToDefer | RcptToReject> | void | RcptToAccept | RcptToDefer | RcptToReject;
  onDataStart?(
    session: SmtpPluginSession
  ): Promise<void | DataStartAccept | DataStartDefer | DataStartReject> | void | DataStartAccept | DataStartDefer | DataStartReject;
  onDataEnd?(session: SmtpPluginSession): Promise<void | DataEndAccept | DataEndDefer | DataEndReject> | void | DataEndAccept | DataEndDefer | DataEndReject;
  onQuit?(session: SmtpPluginSession): Promise<void | QuitAccept | QuitDefer | QuitReject> | void | QuitAccept | QuitDefer | QuitReject;
  onClose?(session: SmtpPluginSession): Promise<void> | void;
  onRset?(session: SmtpPluginSession): Promise<void | RsetAccept | RsetDefer | RsetReject> | void | RsetAccept | RsetDefer | RsetReject;
  onHelp?(session: SmtpPluginSession): Promise<void | HelpAccept | HelpDefer | HelpReject> | void | HelpAccept | HelpDefer | HelpReject;
  onNoop?(session: SmtpPluginSession): Promise<void | NoopAccept | NoopDefer | NoopReject> | void | NoopAccept | NoopDefer | NoopReject;
  onVrfy?(session: SmtpPluginSession, command: SmtpCommand): Promise<void | VrfyAccept | VrfyDefer | VrfyReject> | void | VrfyAccept | VrfyDefer | VrfyReject;
  onUnknown?(
    session: SmtpPluginSession,
    command: SmtpCommand
  ): Promise<void | UnknownAccept | UnknownDefer | UnknownReject> | void | UnknownAccept | UnknownDefer | UnknownReject;
}

interface SmtpPluginConstructor {
  new (logger: Logger, unfig: Unfig): Partial<SmtpPlugin>;
}

class SmtpPluginManager {
  private plugins: Partial<SmtpPlugin>[] = [];

  // Load plugins
  loadPlugins(Plugins: SmtpPluginConstructor[]) {
    for (const Plugin of Plugins) {
      const plugin = new Plugin(logger, unfig);
      unfig.loadPluginConfig(plugin);
      logger.info(`Loaded plugin: ${plugin.constructor.name}`);
      this.plugins.push(plugin);
    }
  }

  // Execute Server Start hooks
  async executeServerStartHooks() {
    for (const plugin of this.plugins) {
      if (plugin.onServerStart) {
        plugin.onServerStart();
      }
    }
  }

  // Execute Server Stop hooks
  async executeServerStopHooks() {
    for (const plugin of this.plugins) {
      if (plugin.onServerStop) {
        plugin.onServerStop();
      }
    }
  }

  // Execute hooks for CONNECT
  async executeConnectHooks(session: SmtpSession) {
    for (const plugin of this.plugins) {
      if (plugin.onConnect) {
        const res = await plugin.onConnect(new SmtpPluginSession(plugin.constructor.name, session));
        if (res) return res;
      }
    }
  }

  // Execute hooks for HELO
  async executeHeloHooks(session: SmtpSession, command: SmtpCommand) {
    for (const plugin of this.plugins) {
      if (plugin.onHelo) {
        const res = await plugin.onHelo(
          new SmtpPluginSession(plugin.constructor.name, session),
          command.argument || '',
          command.name === 'EHLO' ? 'EHLO' : 'HELO'
        );
        if (res) return res;
      }
    }
  }

  // Execute hooks for AUTH
  async executeAuthHooks(session: SmtpSession, username: string, password: string) {
    for (const plugin of this.plugins) {
      if (plugin.onAuth) {
        const res = await plugin.onAuth(new SmtpPluginSession(plugin.constructor.name, session), username, password);
        if (res) return res;
      }
    }
  }

  // Execute hooks for MAIL FROM
  async executeMailFromHooks(session: SmtpSession, address: EnvelopeAddress, command: SmtpCommand) {
    for (const plugin of this.plugins) {
      if (plugin.onMailFrom) {
        const res = await plugin.onMailFrom(new SmtpPluginSession(plugin.constructor.name, session), address, command);
        if (res) return res;
      }
    }
  }

  // Execute hooks for RCPT TO
  async executeRcptToHooks(session: SmtpSession, address: EnvelopeAddress, command: SmtpCommand) {
    for (const plugin of this.plugins) {
      if (plugin.onRcptTo) {
        const res = await plugin.onRcptTo(new SmtpPluginSession(plugin.constructor.name, session), address, command);
        if (res) return res;
      }
    }
  }

  // Execute hooks for DATA start
  async executeDataStartHooks(session: SmtpSession) {
    for (const plugin of this.plugins) {
      if (plugin.onDataStart) {
        const res = await plugin.onDataStart(new SmtpPluginSession(plugin.constructor.name, session));
        if (res) return res;
      }
    }
  }

  // Execute hooks for DATA end
  async executeDataEndHooks(session: SmtpSession) {
    for (const plugin of this.plugins) {
      if (plugin.onDataEnd) {
        const res = await plugin.onDataEnd(new SmtpPluginSession(plugin.constructor.name, session));
        if (res) return res;
      }
    }
  }

  // Execute hooks for QUIT
  async executeQuitHooks(session: SmtpSession) {
    for (const plugin of this.plugins) {
      if (plugin.onQuit) {
        const res = await plugin.onQuit(new SmtpPluginSession(plugin.constructor.name, session));
        if (res) return res;
      }
    }
  }

  // Execute hooks for session close
  async executeCloseHooks(session: SmtpSession) {
    for (const plugin of this.plugins) {
      if (plugin.onClose) {
        // Can't return a response from this hook
        await plugin.onClose(new SmtpPluginSession(plugin.constructor.name, session));
      }
    }
  }

  // Execute hooks for RSET
  async executeRsetHooks(session: SmtpSession) {
    for (const plugin of this.plugins) {
      if (plugin.onRset) {
        const res = await plugin.onRset(new SmtpPluginSession(plugin.constructor.name, session));
        if (res) return res;
      }
    }
  }

  // Execute hooks for HELP
  async executeHelpHooks(session: SmtpSession) {
    for (const plugin of this.plugins) {
      if (plugin.onHelp) {
        const res = await plugin.onHelp(new SmtpPluginSession(plugin.constructor.name, session));
        if (res) return res;
      }
    }
  }

  // Execute hooks for NOOP
  async executeNoopHooks(session: SmtpSession) {
    for (const plugin of this.plugins) {
      if (plugin.onNoop) {
        const res = await plugin.onNoop(new SmtpPluginSession(plugin.constructor.name, session));
        if (res) return res;
      }
    }
  }

  // Execute hooks for VRFY
  async executeVrfyHooks(session: SmtpSession, command: SmtpCommand) {
    for (const plugin of this.plugins) {
      if (plugin.onVrfy) {
        const res = await plugin.onVrfy(new SmtpPluginSession(plugin.constructor.name, session), command);
        if (res) return res;
      }
    }
  }

  // Execute hooks for Unknown commands
  async executeUnknownHooks(session: SmtpSession, command: SmtpCommand) {
    for (const plugin of this.plugins) {
      if (plugin.onUnknown) {
        const res = await plugin.onUnknown(new SmtpPluginSession(plugin.constructor.name, session), command);
        if (res) return res;
      }
    }
  }
}

export const smtpPluginManager = new SmtpPluginManager();
