import type { Socket } from 'bun';
import { version } from '../package.json';
import { hostname } from 'os';
import { UnMtaSession } from './UnMtaSession';
import { unMtaPluginManager } from './UnMtaPlugin';
import { EnvelopeAddress } from './EmailAddress';
import logger from './Logger';

// A Map to keep track of sessions keyed by socket
let sessionCounter = 0;
const sessions = new Map<number, UnMtaSession>();

// Data structure for the socket
interface SocketData {
  id: number;
  timeout?: Timer | null;
}

class SmtpCommand {
  private commands = ['HELO', 'EHLO', 'MAIL FROM:', 'RCPT TO:', 'DATA', 'QUIT', 'HELP'];

  public message: string; // The raw message that was received
  public name: string | undefined; // The command that was received (HELO, MAIL FROM, etc.)
  public argument: string | undefined; // The argument that was received (email address, etc.)

  constructor(data: Buffer) {
    this.message = data.toString().trim();
    this.name = this.commands.find((command) => this.message.toUpperCase().startsWith(command));
    if (this.name) {
      this.argument = this.message.slice(this.name.length).trim(); // Extract the argument
    }
  }
}

export class UnMtaServer {
  plugins: typeof unMtaPluginManager;

  constructor(plugins: typeof unMtaPluginManager) {
    this.plugins = plugins;
  }

  // Start the server
  public start(port = 2525) {
    const smtp = this;
    const server = Bun.listen<SocketData>({
      hostname: 'localhost',
      port: port,
      data: { id: -1, timeout: null },
      socket: {
        async open(sock) {
          // Assign a unique session ID to the socket
          sock.data.id = sessionCounter++;
          const session = new UnMtaSession(sock.data.id);
          sessions.set(sock.data.id, session);
          smtp.resetTimeout(sock); // Start the idle timeout

          logger.debug(`Client connected from ${sock.remoteAddress}`);
          await smtp.plugins.executeConnectHooks();
          smtp.write(sock, `220 ${hostname().toLowerCase()} ESMTP unMta v${version} ready`);
        },
        data(sock, data) {
          const command = new SmtpCommand(data);
          logger.smtp(`> ${command.message}`);
          smtp.resetTimeout(sock); // Reset the idle timeout whenever data is received
          const session = sessions.get(sock.data.id);

          if (!session) {
            logger.warn(`Session ${sock.data.id} not found for socket`); // TODO add more info about session
            smtp.write(sock, '451 4.3.0 Requested action aborted: local error in processing', true);
            return;
          }

          // Handle HELO/EHLO command
          if (command.name === 'HELO' || command.name === 'EHLO') {
            smtp.handleHeloCommand(command, sock, session);
            return;
          }
          // Handle MAIL FROM command
          if (command.name === 'MAIL FROM:') {
            smtp.handleMailFromCommand(command, sock, session);
            return;
          }
          // Handle RCPT TO command
          if (command.name === 'RCPT TO:') {
            smtp.handleRcptToCommand(command, sock, session);
            return;
          }
          // Handle DATA command
          if (command.name === 'DATA') {
            smtp.handleDataCommand(sock, session);
            return;
          }
          // Handle QUIT command
          if (command.name === 'QUIT') {
            smtp.handleQuitCommand(sock, session);
            return;
          }
          if (command.name === 'HELP') {
            smtp.handleHelpCommand(sock, session);
            return;
          }
          // Handle unknown commands
          if (!command.name) {
            smtp.handleUnknownCommand(sock, session);
            return;
          }
        },
        async close(sock) {
          logger.debug('Client disconnected'); // TODO add more info about client (ip, etc.)

          await smtp.plugins.executeCloseHooks();
          // Clean up the session when the connection is closed
          if (sock.data?.id) {
            sessions.delete(sock.data.id);
          }
          if (sock.data?.timeout) {
            clearTimeout(sock.data.timeout);
          }
        },
      },
    });

    logger.info(`SMTP server is running on port ${port}`);
  }

  private async handleHeloCommand(command: SmtpCommand, sock: Socket<SocketData>, session: UnMtaSession) {
    session.phase = 'helo';

    await this.plugins.executeHeloHooks();
    if (command.name === 'EHLO') {
      this.write(sock, '250-Hello');
      this.write(sock, '250-SIZE 10240000');
      this.write(sock, '250 AUTH LOGIN PLAIN');
    } else {
      this.write(sock, '250 Hello');
    }
  }

  private async handleMailFromCommand(command: SmtpCommand, sock: Socket<SocketData>, session: UnMtaSession) {
    if (session.phase !== 'helo') {
      this.write(sock, '503 Bad sequence of commands');
      return;
    }

    if (command.argument) {
      const email = new EnvelopeAddress(command.argument);
      if (email.address) {
        session.sender = email;
        session.phase = 'sender';
        await this.plugins.executeMailFromHooks();
        this.write(sock, '250 OK');
      } else {
        this.write(sock, '550 Invalid address');
      }
    } else {
      this.write(sock, '501 Syntax error in parameters or arguments');
    }
  }

  private async handleRcptToCommand(command: SmtpCommand, sock: Socket<SocketData>, session: UnMtaSession) {
    if (session?.phase !== 'sender') {
      this.write(sock, '503 Bad sequence of commands');
      return;
    }

    if (command.argument) {
      const email = new EnvelopeAddress(command.argument);
      if (email.address) {
        session.recipients.push(email);
        await this.plugins.executeRcptToHooks();
        this.write(sock, '250 OK');
      } else {
        this.write(sock, '550 Invalid address');
      }
    } else {
      this.write(sock, '501 Syntax error in parameters or arguments');
    }
  }

  private async handleDataCommand(sock: Socket<SocketData>, session: UnMtaSession) {
    if (session.phase !== 'recipient') {
      this.write(sock, '503 Bad sequence of commands');
      return;
    }

    await this.plugins.executeDataHooks();
    this.write(sock, '354 Start mail input; end with <CRLF>.<CRLF>');
    // const session = new UnMtaSession(socket);
    // session.startDataMode();
  }

  private async handleQuitCommand(sock: Socket<SocketData>, session: UnMtaSession) {
    await this.plugins.executeQuitHooks();
    this.write(sock, '221 Bye', true);
  }

  private async handleHelpCommand(sock: Socket<SocketData>, session: UnMtaSession) {
    await this.plugins.executeHelpHooks();
    this.write(sock, '214 See: https://unmta.com/');
  }

  private async handleUnknownCommand(sock: Socket<SocketData>, session: UnMtaSession) {
    await this.plugins.executeUnknownHooks();
    this.write(sock, '500 Command not recognized');
  }

  private resetTimeout(sock: Socket<SocketData>) {
    // Clear the existing timeout if set
    if (sock.data?.timeout) {
      clearTimeout(sock.data.timeout);
    }

    // Set a new timeout
    sock.data.timeout = setTimeout(() => {
      logger.debug(`Session ${sock.data.id} timed out due to inactivity.`); // TODO add more info about client (ip, etc.)
      this.write(sock, '421 4.4.2 Connection timed out due to inactivity', true);
    }, 5000);
  }

  private write(sock: Socket<SocketData>, message: string, end = false) {
    logger.smtp(`< ${message}`);
    sock.write(`${message}\r\n`);
    if (end) sock.end();
  }
}
