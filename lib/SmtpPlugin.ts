import type {
  ConnectAccept,
  ConnectDefer,
  ConnectReject,
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
  SmtpSession,
} from '.';

// TODO add parameters to the hooks
// Allow ability to read session data (and write to it within a certain scope)
// Add RSET

// Add ability to modify the response to the client
export interface SmtpPlugin {
  onConnect?: (session: SmtpSession) => Promise<void | ConnectAccept | ConnectDefer | ConnectReject> | void | ConnectAccept | ConnectDefer | ConnectReject;
  onHelo?: (session: SmtpSession) => Promise<void | HeloAccept | HeloDefer | HeloReject> | void | HeloAccept | HeloDefer | HeloReject;
  onMailFrom?: (
    session: SmtpSession
  ) => Promise<void | MailFromAccept | MailFromDefer | MailFromReject> | void | MailFromAccept | MailFromDefer | MailFromReject;
  onRcptTo?: (session: SmtpSession) => Promise<void | RcptToAccept | RcptToDefer | RcptToReject> | void | RcptToAccept | RcptToDefer | RcptToReject;
  onDataStart?: (
    session: SmtpSession
  ) => Promise<void | DataStartAccept | DataStartDefer | DataStartReject> | void | DataStartAccept | DataStartDefer | DataStartReject;
  onDataEnd?: (session: SmtpSession) => Promise<void | DataEndAccept | DataEndDefer | DataEndReject> | void | DataEndAccept | DataEndDefer | DataEndReject;
  onQuit?: (session: SmtpSession) => Promise<void | QuitAccept | QuitDefer | QuitReject> | void | QuitAccept | QuitDefer | QuitReject;
  onClose?: (session: SmtpSession) => Promise<void> | void;
  onRset?: (session: SmtpSession) => Promise<void | RsetAccept | RsetDefer | RsetReject> | void | RsetAccept | RsetDefer | RsetReject;
  onHelp?: (session: SmtpSession) => Promise<void | HelpAccept | HelpDefer | HelpReject> | void | HelpAccept | HelpDefer | HelpReject;
  onNoop?: (session: SmtpSession) => Promise<void | NoopAccept | NoopDefer | NoopReject> | void | NoopAccept | NoopDefer | NoopReject;
  onVrfy?: (session: SmtpSession) => Promise<void | VrfyAccept | VrfyDefer | VrfyReject> | void | VrfyAccept | VrfyDefer | VrfyReject;
  onUnknown?: (session: SmtpSession) => Promise<void | UnknownAccept | UnknownDefer | UnknownReject> | void | UnknownAccept | UnknownDefer | UnknownReject;
}

class SmtpPluginManager {
  private plugins: SmtpPlugin[] = [];

  // Load plugins from configuration or dynamically
  loadPlugins(plugins: SmtpPlugin[]) {
    this.plugins.push(...plugins);
  }

  // Execute hooks for CONNECT
  async executeConnectHooks(session: SmtpSession) {
    for (const plugin of this.plugins) {
      if (plugin.onConnect) {
        return await plugin.onConnect(session);
      }
    }
  }

  // Execute hooks for HELO
  async executeHeloHooks(session: SmtpSession) {
    for (const plugin of this.plugins) {
      if (plugin.onHelo) {
        return await plugin.onHelo(session);
      }
    }
  }

  // Execute hooks for MAIL FROM
  async executeMailFromHooks(session: SmtpSession) {
    for (const plugin of this.plugins) {
      if (plugin.onMailFrom) {
        return await plugin.onMailFrom(session);
      }
    }
  }

  // Execute hooks for RCPT TO
  async executeRcptToHooks(session: SmtpSession) {
    for (const plugin of this.plugins) {
      if (plugin.onRcptTo) {
        return await plugin.onRcptTo(session);
      }
    }
  }

  // Execute hooks for DATA start
  async executeDataStartHooks(session: SmtpSession) {
    for (const plugin of this.plugins) {
      if (plugin.onDataStart) {
        return await plugin.onDataStart(session);
      }
    }
  }

  // Execute hooks for DATA end
  async executeDataEndHooks(session: SmtpSession) {
    for (const plugin of this.plugins) {
      if (plugin.onDataEnd) {
        return await plugin.onDataEnd(session);
      }
    }
  }

  // Execute hooks for QUIT
  async executeQuitHooks(session: SmtpSession) {
    for (const plugin of this.plugins) {
      if (plugin.onQuit) {
        return await plugin.onQuit(session);
      }
    }
  }

  // Execute hooks for session close
  async executeCloseHooks(session: SmtpSession) {
    for (const plugin of this.plugins) {
      if (plugin.onClose) {
        return await plugin.onClose(session);
      }
    }
  }

  // Execute hooks for RSET
  async executeRsetHooks(session: SmtpSession) {
    for (const plugin of this.plugins) {
      if (plugin.onRset) {
        return await plugin.onRset(session);
      }
    }
  }

  // Execute hooks for HELP
  async executeHelpHooks(session: SmtpSession) {
    for (const plugin of this.plugins) {
      if (plugin.onHelp) {
        return await plugin.onHelp(session);
      }
    }
  }

  // Execute hooks for NOOP
  async executeNoopHooks(session: SmtpSession) {
    for (const plugin of this.plugins) {
      if (plugin.onNoop) {
        return await plugin.onNoop(session);
      }
    }
  }

  // Execute hooks for VRFY
  async executeVrfyHooks(session: SmtpSession) {
    for (const plugin of this.plugins) {
      if (plugin.onVrfy) {
        return await plugin.onVrfy(session);
      }
    }
  }

  // Execute hooks for Unknown commands
  async executeUnknownHooks(session: SmtpSession) {
    for (const plugin of this.plugins) {
      if (plugin.onUnknown) {
        return await plugin.onUnknown(session);
      }
    }
  }
}

export const smtpPluginManager = new SmtpPluginManager();
