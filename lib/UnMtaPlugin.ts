// TODO add parameters to the hooks
export interface UnMtaPlugin {
  onConnect?: () => Promise<void> | void;
  onHelo?: () => Promise<void> | void;
  onMailFrom?: () => Promise<void> | void;
  onRcptTo?: () => Promise<void> | void;
  onData?: () => Promise<void> | void;
  onQuit?: () => Promise<void> | void;
  onClose?: () => Promise<void> | void;
  onHelp?: () => Promise<void> | void;
  onUnknown?: () => Promise<void> | void;
}

class UnMtaPluginManager {
  private plugins: UnMtaPlugin[] = [];

  // Load plugins from configuration or dynamically
  loadPlugins(plugins: UnMtaPlugin[]) {
    this.plugins.push(...plugins);
  }

  async executeConnectHooks() {
    for (const plugin of this.plugins) {
      if (plugin.onConnect) {
        await plugin.onConnect();
      }
    }
  }

  async executeHeloHooks() {
    for (const plugin of this.plugins) {
      if (plugin.onHelo) {
        await plugin.onHelo();
      }
    }
  }

  // Execute hooks for MAIL FROM
  async executeMailFromHooks() {
    for (const plugin of this.plugins) {
      if (plugin.onMailFrom) {
        await plugin.onMailFrom();
      }
    }
  }

  // Execute hooks for RCPT TO
  async executeRcptToHooks() {
    for (const plugin of this.plugins) {
      if (plugin.onRcptTo) {
        await plugin.onRcptTo();
      }
    }
  }

  // Execute hooks for DATA
  async executeDataHooks() {
    for (const plugin of this.plugins) {
      if (plugin.onData) {
        await plugin.onData();
      }
    }
  }

  async executeQuitHooks() {
    for (const plugin of this.plugins) {
      if (plugin.onQuit) {
        await plugin.onQuit();
      }
    }
  }

  // Execute hooks for session close
  async executeCloseHooks() {
    for (const plugin of this.plugins) {
      if (plugin.onClose) {
        await plugin.onClose();
      }
    }
  }

  async executeHelpHooks() {
    for (const plugin of this.plugins) {
      if (plugin.onHelp) {
        await plugin.onHelp();
      }
    }
  }

  async executeUnknownHooks() {
    for (const plugin of this.plugins) {
      if (plugin.onUnknown) {
        await plugin.onUnknown();
      }
    }
  }
}

export const unMtaPluginManager = new UnMtaPluginManager();
