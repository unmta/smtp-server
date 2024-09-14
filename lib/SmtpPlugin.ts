import { EventEmitter } from 'events';
import { SmtpCommand, SmtpSession, SmtpPluginSession, EnvelopeAddress } from '.';
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
} from '.';

export interface SmtpPlugin {
  pluginName: string;
  onServerStart?: () => void;
  onConnect?: (
    session: SmtpPluginSession
  ) => Promise<void | ConnectAccept | ConnectDefer | ConnectReject> | void | ConnectAccept | ConnectDefer | ConnectReject;
  onHelo?: (
    session: SmtpPluginSession,
    hostname: string,
    verb: 'HELO' | 'EHLO'
  ) => Promise<void | HeloAccept | HeloDefer | HeloReject> | void | HeloAccept | HeloDefer | HeloReject;
  onAuth?: (
    session: SmtpPluginSession,
    username: string,
    password: string
  ) => Promise<void | AuthAccept | AuthDefer | AuthReject> | void | AuthAccept | AuthDefer | AuthReject;
  onMailFrom?: (
    session: SmtpPluginSession,
    address: EnvelopeAddress
  ) => Promise<void | MailFromAccept | MailFromDefer | MailFromReject> | void | MailFromAccept | MailFromDefer | MailFromReject;
  onRcptTo?: (
    session: SmtpPluginSession,
    address: EnvelopeAddress
  ) => Promise<void | RcptToAccept | RcptToDefer | RcptToReject> | void | RcptToAccept | RcptToDefer | RcptToReject;
  onDataStart?: (
    session: SmtpPluginSession
  ) => Promise<void | DataStartAccept | DataStartDefer | DataStartReject> | void | DataStartAccept | DataStartDefer | DataStartReject;
  onDataBuffer?: (session: SmtpPluginSession, data: Buffer) => void;
  onDataBufferEnd?: (session: SmtpPluginSession) => void;
  onDataEnd?: (
    session: SmtpPluginSession
  ) => Promise<void | DataEndAccept | DataEndDefer | DataEndReject> | void | DataEndAccept | DataEndDefer | DataEndReject;
  onQuit?: (session: SmtpPluginSession) => Promise<void | QuitAccept | QuitDefer | QuitReject> | void | QuitAccept | QuitDefer | QuitReject;
  onClose?: (session: SmtpPluginSession) => Promise<void> | void;
  onRset?: (session: SmtpPluginSession) => Promise<void | RsetAccept | RsetDefer | RsetReject> | void | RsetAccept | RsetDefer | RsetReject;
  onHelp?: (session: SmtpPluginSession) => Promise<void | HelpAccept | HelpDefer | HelpReject> | void | HelpAccept | HelpDefer | HelpReject;
  onNoop?: (session: SmtpPluginSession) => Promise<void | NoopAccept | NoopDefer | NoopReject> | void | NoopAccept | NoopDefer | NoopReject;
  onVrfy?: (
    session: SmtpPluginSession,
    command: SmtpCommand
  ) => Promise<void | VrfyAccept | VrfyDefer | VrfyReject> | void | VrfyAccept | VrfyDefer | VrfyReject;
  onUnknown?: (
    session: SmtpPluginSession,
    command: SmtpCommand
  ) => Promise<void | UnknownAccept | UnknownDefer | UnknownReject> | void | UnknownAccept | UnknownDefer | UnknownReject;
}

class SmtpPluginManager {
  private plugins: SmtpPlugin[] = [];

  // Load plugins from configuration or dynamically
  loadPlugins(plugins: SmtpPlugin[]) {
    this.plugins.push(...plugins);
  }

  async executeServerStartHooks() {
    for (const plugin of this.plugins) {
      if (plugin.onServerStart) {
        plugin.onServerStart();
      }
    }
  }

  // Execute hooks for CONNECT
  async executeConnectHooks(session: SmtpSession) {
    for (const plugin of this.plugins) {
      if (plugin.onConnect) {
        return await plugin.onConnect(new SmtpPluginSession(plugin.pluginName, session));
      }
    }
  }

  // Execute hooks for HELO
  async executeHeloHooks(session: SmtpSession, command: SmtpCommand) {
    for (const plugin of this.plugins) {
      if (plugin.onHelo) {
        return await plugin.onHelo(new SmtpPluginSession(plugin.pluginName, session), command.argument || '', command.name === 'EHLO' ? 'EHLO' : 'HELO');
      }
    }
  }

  // Execute hooks for AUTH
  async executeAuthHooks(session: SmtpSession, username: string, password: string) {
    for (const plugin of this.plugins) {
      if (plugin.onAuth) {
        return await plugin.onAuth(new SmtpPluginSession(plugin.pluginName, session), username, password);
      }
    }
  }

  // Execute hooks for MAIL FROM
  async executeMailFromHooks(session: SmtpSession, address: EnvelopeAddress) {
    for (const plugin of this.plugins) {
      if (plugin.onMailFrom) {
        return await plugin.onMailFrom(new SmtpPluginSession(plugin.pluginName, session), address);
      }
    }
  }

  // Execute hooks for RCPT TO
  async executeRcptToHooks(session: SmtpSession, address: EnvelopeAddress) {
    for (const plugin of this.plugins) {
      if (plugin.onRcptTo) {
        return await plugin.onRcptTo(new SmtpPluginSession(plugin.pluginName, session), address);
      }
    }
  }

  // Execute hooks for DATA start
  async executeDataStartHooks(session: SmtpSession) {
    for (const plugin of this.plugins) {
      if (plugin.onDataStart) {
        return await plugin.onDataStart(new SmtpPluginSession(plugin.pluginName, session));
      }
    }
  }

  // Execute hooks for message data events
  registerDataHooks(event: EventEmitter): void {
    for (const plugin of this.plugins) {
      if (plugin.onDataBuffer) {
        event.on('data', (session: SmtpSession, data: Buffer) => {
          plugin.onDataBuffer?.(new SmtpPluginSession(plugin.pluginName, session), data);
        });
      }
      if (plugin.onDataBufferEnd) {
        event.on('end', (session: SmtpSession) => {
          plugin.onDataBufferEnd?.(new SmtpPluginSession(plugin.pluginName, session));
        });
      }
    }
  }

  // Execute hooks for DATA end
  async executeDataEndHooks(session: SmtpSession) {
    for (const plugin of this.plugins) {
      if (plugin.onDataEnd) {
        return await plugin.onDataEnd(new SmtpPluginSession(plugin.pluginName, session));
      }
    }
  }

  // Execute hooks for QUIT
  async executeQuitHooks(session: SmtpSession) {
    for (const plugin of this.plugins) {
      if (plugin.onQuit) {
        return await plugin.onQuit(new SmtpPluginSession(plugin.pluginName, session));
      }
    }
  }

  // Execute hooks for session close
  async executeCloseHooks(session: SmtpSession) {
    for (const plugin of this.plugins) {
      if (plugin.onClose) {
        // Can't return a response from this hook
        await plugin.onClose(new SmtpPluginSession(plugin.pluginName, session));
      }
    }
  }

  // Execute hooks for RSET
  async executeRsetHooks(session: SmtpSession) {
    for (const plugin of this.plugins) {
      if (plugin.onRset) {
        return await plugin.onRset(new SmtpPluginSession(plugin.pluginName, session));
      }
    }
  }

  // Execute hooks for HELP
  async executeHelpHooks(session: SmtpSession) {
    for (const plugin of this.plugins) {
      if (plugin.onHelp) {
        return await plugin.onHelp(new SmtpPluginSession(plugin.pluginName, session));
      }
    }
  }

  // Execute hooks for NOOP
  async executeNoopHooks(session: SmtpSession) {
    for (const plugin of this.plugins) {
      if (plugin.onNoop) {
        return await plugin.onNoop(new SmtpPluginSession(plugin.pluginName, session));
      }
    }
  }

  // Execute hooks for VRFY
  async executeVrfyHooks(session: SmtpSession, command: SmtpCommand) {
    for (const plugin of this.plugins) {
      if (plugin.onVrfy) {
        return await plugin.onVrfy(new SmtpPluginSession(plugin.pluginName, session), command);
      }
    }
  }

  // Execute hooks for Unknown commands
  async executeUnknownHooks(session: SmtpSession, command: SmtpCommand) {
    for (const plugin of this.plugins) {
      if (plugin.onUnknown) {
        return await plugin.onUnknown(new SmtpPluginSession(plugin.pluginName, session), command);
      }
    }
  }
}

export const smtpPluginManager = new SmtpPluginManager();
