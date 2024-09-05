import { SMTPServer } from './lib/SMTPServer';
import { pluginManager } from './lib/SMTPPlugin';
import emailLoggerPlugin from './tmpPlugin'; // Import the sample plugin

// Load the plugins
pluginManager.loadPlugins([emailLoggerPlugin]);

// Start the SMTP server
const server = new SMTPServer(pluginManager);
server.start();
