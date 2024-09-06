import type { UnMtaSession } from './UnMtaSession';

// TODO add parameters to the hooks
// Allow ability to read session data (and write to it within a certain scope)
// Add RSET

// Add ability to modify the response to the client
export interface UnMtaPlugin {
  onConnect?: (session: UnMtaSession) => Promise<void> | void;
  onHelo?: (session: UnMtaSession) => Promise<void> | void;
  onMailFrom?: (session: UnMtaSession) => Promise<void> | void;
  onRcptTo?: (session: UnMtaSession) => Promise<void> | void;
  onDataStart?: (session: UnMtaSession) => Promise<void> | void;
  onDataEnd?: (session: UnMtaSession) => Promise<void> | void;
  onQuit?: (session: UnMtaSession) => Promise<void> | void;
  onClose?: (session: UnMtaSession) => Promise<void> | void;
  onRset?: (session: UnMtaSession) => Promise<void> | void;
  onHelp?: (session: UnMtaSession) => Promise<void> | void;
  onNoop?: (session: UnMtaSession) => Promise<void> | void;
  onVrfy?: (session: UnMtaSession) => Promise<void> | void;
  onUnknown?: (session: UnMtaSession) => Promise<void> | void;
}

class UnMtaPluginManager {
  private plugins: UnMtaPlugin[] = [];

  // Load plugins from configuration or dynamically
  loadPlugins(plugins: UnMtaPlugin[]) {
    this.plugins.push(...plugins);
  }

  // Execute hooks for CONNECT
  async executeConnectHooks(session: UnMtaSession) {
    for (const plugin of this.plugins) {
      if (plugin.onConnect) {
        await plugin.onConnect(session);
      }
    }
  }

  // Execute hooks for HELO
  async executeHeloHooks(session: UnMtaSession) {
    for (const plugin of this.plugins) {
      if (plugin.onHelo) {
        await plugin.onHelo(session);
      }
    }
  }

  // Execute hooks for MAIL FROM
  async executeMailFromHooks(session: UnMtaSession) {
    for (const plugin of this.plugins) {
      if (plugin.onMailFrom) {
        await plugin.onMailFrom(session);
      }
    }
  }

  // Execute hooks for RCPT TO
  async executeRcptToHooks(session: UnMtaSession) {
    for (const plugin of this.plugins) {
      if (plugin.onRcptTo) {
        await plugin.onRcptTo(session);
      }
    }
  }

  // Execute hooks for DATA start
  async executeDataStartHooks(session: UnMtaSession) {
    for (const plugin of this.plugins) {
      if (plugin.onDataStart) {
        await plugin.onDataStart(session);
      }
    }
  }

  // Execute hooks for DATA end
  async executeDataEndHooks(session: UnMtaSession) {
    for (const plugin of this.plugins) {
      if (plugin.onDataEnd) {
        await plugin.onDataEnd(session);
      }
    }
  }

  // Execute hooks for QUIT
  async executeQuitHooks(session: UnMtaSession) {
    for (const plugin of this.plugins) {
      if (plugin.onQuit) {
        await plugin.onQuit(session);
      }
    }
  }

  // Execute hooks for session close
  async executeCloseHooks(session: UnMtaSession) {
    for (const plugin of this.plugins) {
      if (plugin.onClose) {
        await plugin.onClose(session);
      }
    }
  }

  // Execute hooks for RSET
  async executeRsetHooks(session: UnMtaSession) {
    for (const plugin of this.plugins) {
      if (plugin.onRset) {
        await plugin.onRset(session);
      }
    }
  }

  // Execute hooks for HELP
  async executeHelpHooks(session: UnMtaSession) {
    for (const plugin of this.plugins) {
      if (plugin.onHelp) {
        await plugin.onHelp(session);
      }
    }
  }

  // Execute hooks for NOOP
  async executeNoopHooks(session: UnMtaSession) {
    for (const plugin of this.plugins) {
      if (plugin.onNoop) {
        await plugin.onNoop(session);
      }
    }
  }

  // Execute hooks for VRFY
  async executeVrfyHooks(session: UnMtaSession) {
    for (const plugin of this.plugins) {
      if (plugin.onVrfy) {
        await plugin.onVrfy(session);
      }
    }
  }

  // Execute hooks for Unknown commands
  async executeUnknownHooks(session: UnMtaSession) {
    for (const plugin of this.plugins) {
      if (plugin.onUnknown) {
        await plugin.onUnknown(session);
      }
    }
  }
}

export const unMtaPluginManager = new UnMtaPluginManager();
