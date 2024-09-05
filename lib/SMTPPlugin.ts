// TODO add connect hook
// TODO add parameters to the hooks
// TODO add hooks to remaining events
export interface SMTPPlugin {
  onMailFrom?: () => Promise<void> | void;
  onRcptTo?: () => Promise<void> | void;
  onData?: () => Promise<void> | void;
  onClose?: () => Promise<void> | void;
}

class PluginManager {
  private plugins: SMTPPlugin[] = [];

  // Load plugins from configuration or dynamically
  loadPlugins(plugins: SMTPPlugin[]) {
    this.plugins.push(...plugins);
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

  // Execute hooks for session close
  async executeCloseHooks() {
    for (const plugin of this.plugins) {
      if (plugin.onClose) {
        await plugin.onClose();
      }
    }
  }
}

export const pluginManager = new PluginManager();
