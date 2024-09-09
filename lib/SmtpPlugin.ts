import type { SmtpSession } from '.';

// TODO add parameters to the hooks
// Allow ability to read session data (and write to it within a certain scope)
// Add RSET

// Add ability to modify the response to the client
export interface SmtpPlugin {
  onConnect?: (session: SmtpSession) => Promise<void> | void;
  onHelo?: (session: SmtpSession) => Promise<void> | void;
  onMailFrom?: (session: SmtpSession) => Promise<void> | void;
  onRcptTo?: (session: SmtpSession) => Promise<void> | void;
  onDataStart?: (session: SmtpSession) => Promise<void> | void;
  onDataEnd?: (session: SmtpSession) => Promise<void> | void;
  onQuit?: (session: SmtpSession) => Promise<void> | void;
  onClose?: (session: SmtpSession) => Promise<void> | void;
  onRset?: (session: SmtpSession) => Promise<void> | void;
  onHelp?: (session: SmtpSession) => Promise<void> | void;
  onNoop?: (session: SmtpSession) => Promise<void> | void;
  onVrfy?: (session: SmtpSession) => Promise<void> | void;
  onUnknown?: (session: SmtpSession) => Promise<void> | void;
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
        await plugin.onConnect(session);
      }
    }
  }

  // Execute hooks for HELO
  async executeHeloHooks(session: SmtpSession) {
    for (const plugin of this.plugins) {
      if (plugin.onHelo) {
        await plugin.onHelo(session);
      }
    }
  }

  // Execute hooks for MAIL FROM
  async executeMailFromHooks(session: SmtpSession) {
    for (const plugin of this.plugins) {
      if (plugin.onMailFrom) {
        await plugin.onMailFrom(session);
      }
    }
  }

  // Execute hooks for RCPT TO
  async executeRcptToHooks(session: SmtpSession) {
    for (const plugin of this.plugins) {
      if (plugin.onRcptTo) {
        await plugin.onRcptTo(session);
      }
    }
  }

  // Execute hooks for DATA start
  async executeDataStartHooks(session: SmtpSession) {
    for (const plugin of this.plugins) {
      if (plugin.onDataStart) {
        await plugin.onDataStart(session);
      }
    }
  }

  // Execute hooks for DATA end
  async executeDataEndHooks(session: SmtpSession) {
    for (const plugin of this.plugins) {
      if (plugin.onDataEnd) {
        await plugin.onDataEnd(session);
      }
    }
  }

  // Execute hooks for QUIT
  async executeQuitHooks(session: SmtpSession) {
    for (const plugin of this.plugins) {
      if (plugin.onQuit) {
        await plugin.onQuit(session);
      }
    }
  }

  // Execute hooks for session close
  async executeCloseHooks(session: SmtpSession) {
    for (const plugin of this.plugins) {
      if (plugin.onClose) {
        await plugin.onClose(session);
      }
    }
  }

  // Execute hooks for RSET
  async executeRsetHooks(session: SmtpSession) {
    for (const plugin of this.plugins) {
      if (plugin.onRset) {
        await plugin.onRset(session);
      }
    }
  }

  // Execute hooks for HELP
  async executeHelpHooks(session: SmtpSession) {
    for (const plugin of this.plugins) {
      if (plugin.onHelp) {
        await plugin.onHelp(session);
      }
    }
  }

  // Execute hooks for NOOP
  async executeNoopHooks(session: SmtpSession) {
    for (const plugin of this.plugins) {
      if (plugin.onNoop) {
        await plugin.onNoop(session);
      }
    }
  }

  // Execute hooks for VRFY
  async executeVrfyHooks(session: SmtpSession) {
    for (const plugin of this.plugins) {
      if (plugin.onVrfy) {
        await plugin.onVrfy(session);
      }
    }
  }

  // Execute hooks for Unknown commands
  async executeUnknownHooks(session: SmtpSession) {
    for (const plugin of this.plugins) {
      if (plugin.onUnknown) {
        await plugin.onUnknown(session);
      }
    }
  }
}

export const smtpPluginManager = new SmtpPluginManager();
