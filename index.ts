import { UnMtaServer } from './lib/UnMtaServer';
import { unMtaPluginManager } from './lib/UnMtaPlugin';
import emailLoggerPlugin from './tmpPlugin'; // Import the sample plugin

// Load the plugins
unMtaPluginManager.loadPlugins([emailLoggerPlugin]);

// Start the SMTP server
const server = new UnMtaServer(unMtaPluginManager);
server.start();
