import { SmtpServer } from './lib/SmtpServer';
import { smtpPluginManager } from './lib/SmtpPlugin';
import emailLoggerPlugin from './tmpPlugin'; // Import the sample plugin

// Load the plugins
smtpPluginManager.loadPlugins([emailLoggerPlugin]);

// Start the SMTP server
const server = new SmtpServer(smtpPluginManager);
server.start();
