import type { Socket } from 'bun';
import { version } from '../package.json';
import { hostname } from 'os';
import { SmtpSession, smtpPluginManager, SmtpCommand } from './';
import { EnvelopeAddress } from './EmailAddress';
import logger from './Logger';

// Enable plugins to modify the response to the client
// Expose readable stream to session for data phase
// Convert writablestream into duplex or transform stream?
// default should be to reject for mail from/rcpt to?
// Add support for STARTTLS
// Add support for AUTH LOGIN and PLAIN
// Ability to transform the data stream? change headers, body, etc.

// A Map to keep track of sessions keyed by socket
let sessionCounter = 1;
const sessions = new Map<number, SmtpSession>();

// Data structure for the socket (and internal session store)
interface SocketData {
  id: number;
  timeout?: Timer | null;
  messageWriteStream: WritableStream | null;
  messageWriteStreamWriter: WritableStreamDefaultWriter<Uint8Array> | null;
  lastDataChunks: string[]; // The last 3 chunks of data received from DATA phase. Used to detect end of data.
}

export class SmtpServer {
  private plugins: typeof smtpPluginManager | null;

  constructor(plugins: typeof smtpPluginManager | null = null) {
    this.plugins = plugins;
  }

  // Start the server
  public start(port = 2525) {
    const smtp = this;
    const server = Bun.listen<SocketData>({
      hostname: 'localhost',
      port: port,
      data: { id: 0, timeout: null, messageWriteStream: null, messageWriteStreamWriter: null, lastDataChunks: [] },
      socket: {
        async open(sock) {
          const session = smtp.resetSession(sock, sessionCounter++); // Set the session state

          logger.debug(`Client connected from ${sock.remoteAddress}`);
          await smtp.plugins?.executeConnectHooks(session);
          smtp.write(sock, `220 ${hostname().toLowerCase()} ESMTP unMta v${version} ready`);
        },
        data(sock, data) {
          smtp.resetTimeout(sock); // Reset the idle timeout whenever data is received
          const session = sessions.get(sock.data.id);

          // If we are in DATA mode, handle the incoming data accordingly
          if (session && session.isDataMode) {
            smtp.handleData(sock, session, data);
            return;
          }

          const command = new SmtpCommand(data);
          logger.smtp(`> ${command.message}`);

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
          // Handle RSET command
          if (command.name === 'RSET') {
            smtp.handleRsetCommand(sock, session);
            return;
          }
          // Handle HELP command
          if (command.name === 'HELP') {
            smtp.handleHelpCommand(sock, session);
            return;
          }
          // Handle NOOP command
          if (command.name === 'NOOP') {
            smtp.handleNoopCommand(sock, session);
            return;
          }
          // Handle VRFY command
          if (command.name === 'VRFY') {
            smtp.handleVrfyCommand(sock, session);
            return;
          }
          // Handle unknown commands
          if (!command.name) {
            smtp.handleUnknownCommand(sock, session);
            return;
          }
        },
        async close(sock) {
          // Trigger executeCloseHooks and clean up the session when the connection is closed
          if (sock.data?.id) {
            const session = sessions.get(sock.data.id);
            if (session) {
              await smtp.plugins?.executeCloseHooks(session);
              logger.debug(`Client ${sock.remoteAddress} disconnected. ${Date.now() - session.startTime}ms`); // TODO add more info about client (ip, etc.)
            }
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

  // (Re)set the session state
  private resetSession(sock: Socket<SocketData>, id: number, phase: 'connection' | 'helo' = 'connection', currentSession: SmtpSession | null = null) {
    const newConnection = !sock.data.id;
    logger.debug(`${newConnection ? 'Setting' : 'Resetting'} session ${id} to ${phase} phase`);
    if (!newConnection) this.resetTimeout(sock, true); // Clear timeout if this isn't a new connection to prevent timeouts stacking up
    // Always (re)initialize entire sock.data here.
    sock.data = { id: id, timeout: null, messageWriteStream: null, messageWriteStreamWriter: null, lastDataChunks: [] };
    const session = new SmtpSession(sock.data.id, phase, currentSession);
    sessions.set(sock.data.id, session);
    this.resetTimeout(sock); // Set the idle timeout
    return session;
  }

  private async handleHeloCommand(command: SmtpCommand, sock: Socket<SocketData>, session: SmtpSession) {
    if (!command.argument) {
      this.write(sock, '501 domain/address required');
      return;
    }
    // If we're past the helo phase, reset the session
    if (session.phase !== 'connection' && session.phase !== 'helo') {
      // TODO: Unlike RSET, this may need to also reset certain socket data points like ESMTP flags, etc
      this.resetSession(sock, sock.data.id, 'connection', session);
    }
    session.phase = 'helo';

    await this.plugins?.executeHeloHooks(session);
    if (command.name === 'EHLO') {
      this.write(sock, '250-Hello');
      this.write(sock, '250-SIZE 10240000');
      this.write(sock, '250 AUTH LOGIN PLAIN');
    } else {
      this.write(sock, '250 Hello');
    }
  }

  private async handleMailFromCommand(command: SmtpCommand, sock: Socket<SocketData>, session: SmtpSession) {
    if (session.phase !== 'helo') {
      this.write(sock, '503 Bad sequence of commands');
      return;
    }

    if (command.argument) {
      const email = new EnvelopeAddress(command.argument);
      if (email.address) {
        session.sender = email;
        session.phase = 'sender';
        await this.plugins?.executeMailFromHooks(session);
        this.write(sock, '250 OK');
      } else {
        this.write(sock, '550 Invalid address');
      }
    } else {
      this.write(sock, '501 Syntax error in parameters or arguments');
    }
  }

  private async handleRcptToCommand(command: SmtpCommand, sock: Socket<SocketData>, session: SmtpSession) {
    if (session?.phase !== 'sender' && session?.phase !== 'recipient') {
      this.write(sock, '503 Bad sequence of commands');
      return;
    }

    if (command.argument) {
      const email = new EnvelopeAddress(command.argument);
      if (email.address) {
        session.recipients.push(email);
        session.phase = 'recipient';
        await this.plugins?.executeRcptToHooks(session);
        this.write(sock, '250 OK');
      } else {
        this.write(sock, '550 Invalid address');
      }
    } else {
      this.write(sock, '501 Syntax error in parameters or arguments');
    }
  }

  // Handle the DATA command
  private async handleDataCommand(sock: Socket<SocketData>, session: SmtpSession) {
    if (session.phase !== 'recipient') {
      this.write(sock, '503 Bad sequence of commands');
      return;
    }

    session.phase = 'data';
    session.isDataMode = true; // Enter DATA mode
    sock.data.messageWriteStream = new WritableStream();
    sock.data.messageWriteStreamWriter = sock.data.messageWriteStream.getWriter();

    await this.plugins?.executeDataStartHooks(session);
    this.write(sock, '354 Start mail input; end with <CRLF>.<CRLF>');
  }

  // Handle incoming data stream
  private async handleData(sock: Socket<SocketData>, session: SmtpSession, data: Buffer) {
    await sock.data.messageWriteStreamWriter?.write(data);
    // Check if the data ends with single dot '\r\n.\r\n'.
    // We do this by keeping track of the last 5 characters of the last 3 chunks of data
    // This enables telnet-style connections to send a \r\n, then a ., then another \r\n
    sock.data.lastDataChunks.push(data.toString().slice(-5));
    if (sock.data.lastDataChunks.length > 3) sock.data.lastDataChunks.shift();
    if (sock.data.lastDataChunks.join('').match(/\r\n.\r\n$/)) {
      this.handleDataEnd(sock, session);
    }
  }

  // Handle the end of the data stream
  private async handleDataEnd(sock: Socket<SocketData>, session: SmtpSession) {
    await sock.data.messageWriteStreamWriter?.close();
    session.isDataMode = false; // Exit DATA mode
    session.phase = 'postdata';
    await this.plugins?.executeDataEndHooks(session);
    this.write(sock, '250 Message accepted');
  }

  private async handleQuitCommand(sock: Socket<SocketData>, session: SmtpSession) {
    await this.plugins?.executeQuitHooks(session);
    this.write(sock, '221 Bye', true);
  }

  private async handleRsetCommand(sock: Socket<SocketData>, session: SmtpSession) {
    // Only reset session if we're past the connection phase - otherwise there's nothing to reset
    if (session.phase !== 'connection') {
      await this.plugins?.executeRsetHooks(session);
      this.resetSession(sock, sock.data.id, 'helo', session); // Reset the session state, AFTER the HELO phase
      // TODO - if we store HELO/EHLO data, we need to NOT reset that
    }
    this.write(sock, '250 OK');
  }

  private async handleHelpCommand(sock: Socket<SocketData>, session: SmtpSession) {
    await this.plugins?.executeHelpHooks(session);
    this.write(sock, '214 See: https://unmta.com/');
  }

  private async handleNoopCommand(sock: Socket<SocketData>, session: SmtpSession) {
    await this.plugins?.executeNoopHooks(session);
    this.write(sock, '250 OK');
  }

  private async handleVrfyCommand(sock: Socket<SocketData>, session: SmtpSession) {
    await this.plugins?.executeVrfyHooks(session);
    this.write(sock, '252 Will not VRFY user, but may accept message and attempt delivery');
  }

  private async handleUnknownCommand(sock: Socket<SocketData>, session: SmtpSession) {
    await this.plugins?.executeUnknownHooks(session);
    this.write(sock, '500 Command not recognized');
  }

  private resetTimeout(sock: Socket<SocketData>, clearOnly = false) {
    // Clear the existing timeout if set
    if (sock.data?.timeout) {
      clearTimeout(sock.data.timeout);
    }

    if (clearOnly) return; // Only clear the timeout, don't set a new one

    // Set a new timeout
    sock.data.timeout = setTimeout(() => {
      logger.debug(`Session ${sock.data.id} timed out due to inactivity.`); // TODO add more info about client (ip, etc.)
      this.write(sock, '421 4.4.2 Connection timed out due to inactivity', true);
    }, 15000);
  }

  private write(sock: Socket<SocketData>, message: string, end = false) {
    logger.smtp(`< ${message}`);
    sock.write(`${message}\r\n`);
    if (end) sock.end();
  }
}
