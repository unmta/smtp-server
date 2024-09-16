import { createServer, Socket } from 'net';
import fs from 'fs';
import toml from 'toml';
import { EventEmitter } from 'events';
import {
  SmtpSession,
  EnvelopeAddress,
  smtpPluginManager,
  SmtpCommand,
  SmtpResponse,
  SmtpResponseAny,
  ConnectAccept,
  HeloAccept,
  AuthAccept,
  RsetAccept,
} from './';
import logger from './Logger';

const unfig = toml.parse(fs.readFileSync('unfig.toml', 'utf-8'));

// A Map to keep track of sessions keyed by socket
let sessionCounter = 1;
const sessions = new Map<number, SmtpSession>();

// Data structure for the socket (and internal session store)
interface SocketData {
  id: number;
  timeout?: Timer | null;
  authenticating: boolean | string; // true or string of username during AUTH LOGIN process
  onDataBufferEvent?: EventEmitter | null; // Event emitter for incoming message data stream
  lastDataChunks: string[]; // The last 5 chunks of data received from DATA phase. Used to detect end of data.
}
interface SmtpSocket extends Socket {
  data: SocketData;
}

export class SmtpServer {
  private plugins: typeof smtpPluginManager | null;

  constructor(plugins: typeof smtpPluginManager | null = null) {
    this.plugins = plugins;
  }

  // Start the server
  public async start() {
    const smtp = this;
    await this.plugins?.executeServerStartHooks();
    const server = createServer();

    server.on('connection', async (sock: SmtpSocket) => {
      const remoteAddress = sock.remoteAddress; // This becomes undefined when the connection is closed, so store it here.
      const session = smtp.resetSession(sock, sessionCounter++); // Set the session state

      logger.debug(`Client connected from ${remoteAddress}`);
      const pluginResponse = await smtp.plugins?.executeConnectHooks(session);
      smtp.respond(sock, pluginResponse || SmtpResponse.Connect.accept(), pluginResponse && !(pluginResponse instanceof ConnectAccept) ? true : false);

      sock.on('data', async (data: Buffer) => {
        smtp.resetTimeout(sock); // Reset the idle timeout whenever data is received
        const session = sessions.get(sock.data.id);

        // If we are in DATA mode, handle the incoming data accordingly
        if (session && session.isDataMode) {
          smtp.handleData(sock, session, data);
          return;
        }

        const command = new SmtpCommand(data);
        logger.smtp(`> ${command.raw}`);

        if (!session) {
          logger.warn(`Session ${sock.data.id} not found for socket`); // TODO add more info about session
          smtp.respond(sock, SmtpResponse.Connect.defer(), true);
          return;
        }

        // If sock.data.auth is true or a string, we're in the AUTH LOGIN process
        if (sock.data.authenticating !== false) {
          smtp.handleAuthLogin(command, sock, session);
          return;
        }

        // Handle HELO/EHLO command
        if (command.name === 'HELO' || command.name === 'EHLO') {
          smtp.handleHeloCommand(command, sock, session);
          return;
        }
        // Handle AUTH command
        if (command.name === 'AUTH') {
          smtp.handleAuthCommand(command, sock, session);
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
          smtp.handleVrfyCommand(command, sock, session);
          return;
        }
        // Handle unknown commands
        if (!command.name) {
          smtp.handleUnknownCommand(command, sock, session);
          return;
        }
      });

      sock.on('end', async () => {
        await smtp.endSocket(sock);
      });

      sock.on('error', async (err) => {
        logger.error(`Client ${remoteAddress} connection error: ${err}`); // TODO add more info about client (ip, etc.)
        await smtp.endSocket(sock);
      });
    });

    server.listen(unfig.smtp.port, () => {
      logger.info(`UnMTA SMTP server is running on ${unfig.smtp.listen}:${unfig.smtp.port}`);
    });
  }

  // (Re)set the session state
  private resetSession(sock: SmtpSocket, id: number, phase: 'connection' | 'helo' = 'connection', currentSession: SmtpSession | null = null) {
    const newConnection = !sock?.data?.id;
    logger.debug(`${newConnection ? 'Setting' : 'Resetting'} session ${id} to ${phase} phase`);
    if (!newConnection) this.resetTimeout(sock, true); // Clear timeout if this isn't a new connection to prevent timeouts stacking up
    // Always (re)initialize entire sock.data here.
    sock.data = { id: id, timeout: null, authenticating: false, onDataBufferEvent: null, lastDataChunks: [] };
    const session = new SmtpSession(sock.data.id, phase, currentSession);
    sessions.set(sock.data.id, session);
    this.resetTimeout(sock); // Set the idle timeout
    return session;
  }

  private async handleHeloCommand(command: SmtpCommand, sock: SmtpSocket, session: SmtpSession) {
    if (!command.argument) {
      this.respond(sock, new SmtpResponseAny(501, '5.5.4 Syntax error in parameters or arguments'));
      return;
    }
    // If we're past the helo phase, reset the session
    if (session.phase !== 'connection' && session.phase !== 'helo') {
      // TODO: Unlike RSET, this may need to also reset certain socket data points like ESMTP flags, etc
      this.resetSession(sock, sock.data.id, 'connection', session);
    }
    session.phase = 'helo';
    session.greetingType = command.name === 'EHLO' ? 'EHLO' : 'HELO';

    const pluginResponse = await this.plugins?.executeHeloHooks(session, command);
    if (command.name === 'EHLO') {
      // If not an accept response, send as regular response
      if (pluginResponse && !(pluginResponse instanceof HeloAccept)) {
        this.respond(sock, pluginResponse);
      } else {
        // Send extended response
        const ehloLines: string[] = [];
        if (unfig.auth.enable && (!unfig.auth.requireTLS || session.isSecure)) ehloLines.push('AUTH LOGIN PLAIN');
        if (unfig.tls.enableStartTLS) ehloLines.push('STARTTLS');
        ehloLines.push('SIZE 0'); // TODO: Add SIZE support
        this.respondExtended(sock, pluginResponse || SmtpResponse.Helo.accept(), ehloLines);
      }
    } else {
      // If HELO, send regular response
      this.respond(sock, pluginResponse || SmtpResponse.Helo.accept());
    }
  }

  private async handleAuthCommand(command: SmtpCommand, sock: SmtpSocket, session: SmtpSession) {
    // Ensure we've completed the HELO (EHLO) phase
    if (session.phase !== 'helo' && session.phase !== 'auth') {
      this.respond(sock, new SmtpResponseAny(503, '5.5.1 Bad sequence of commands'));
      return;
    }
    // Ensure AUTH is enabled
    if (!unfig.auth.enable) {
      this.handleUnknownCommand(command, sock, session);
      return;
    }
    // Ensure we're using EHLO
    if (session.greetingType !== 'EHLO') {
      this.respond(sock, new SmtpResponseAny(503, '5.5.1 Authentication requires EHLO'));
      return;
    }
    // Ensure we're not already authenticated
    if (session.isAuthenticated) {
      this.respond(sock, new SmtpResponseAny(503, '5.7.0 Already authenticated'));
      return;
    }
    // Ensure we're using a secure connection if required
    if (unfig.auth.requireTLS && !session.isSecure) {
      this.respond(sock, new SmtpResponseAny(530, '5.7.0 Authentication requires a secure connection'));
      return;
    }
    // Ensure correct parameters
    const args = command.argument?.split(/\s+/);
    if (
      !command.argument || // No args after the AUTH command
      (args && args[0].toUpperCase() === 'LOGIN' && args.length !== 1) || // LOGIN requires no args
      (args && args[0].toUpperCase() === 'PLAIN' && args.length !== 2) // PLAIN requires exactly 1 arg
    ) {
      this.respond(sock, new SmtpResponseAny(501, '5.5.4 Syntax error in parameters or arguments'));
      return;
    }
    // Should be a valid AUTH command. Set phase to 'auth'
    session.phase = 'auth';

    // Parse AUTH PLAIN
    if (args && args[0].toUpperCase() === 'PLAIN') {
      const auth = Buffer.from(args[1], 'base64').toString().split('\0');
      if (auth.length !== 3) {
        this.respond(sock, new SmtpResponseAny(501, '5.5.4 Syntax error in parameters or arguments'));
        return;
      }
      this.runAuthPlugins(command, sock, session, auth[1], auth[2]);
      return;
    }
    // Parse AUTH LOGIN
    if (args && args[0].toUpperCase() === 'LOGIN') {
      sock.data.authenticating = true; // Flag that we're in the AUTH LOGIN process
      this.write(sock, '334 VXNlcm5hbWU6'); // Request username
      return; // Send back to data listener for referral to handleAuthLogin
    }

    // If we get here, we don't know what to do with the AUTH command
    this.respond(sock, new SmtpResponseAny(501, '5.5.4 Syntax error in parameters or arguments'));
  }

  // Handle the multi-step AUTH LOGIN commands
  private handleAuthLogin(command: SmtpCommand, sock: SmtpSocket, session: SmtpSession) {
    // If no command data found
    if (!command.raw) {
      sock.data.authenticating = false;
      this.respond(sock, new SmtpResponseAny(501, '5.5.4 Syntax error in parameters or arguments'));
      return;
    }

    const data = Buffer.from(command.raw, 'base64').toString();
    // If we're in the username phase
    if (sock.data.authenticating === true) {
      sock.data.authenticating = data; // Store the username
      this.write(sock, '334 UGFzc3dvcmQ6'); // Request password
      return;
    }

    // We're in the password phase
    const username = sock.data.authenticating as string;
    const password = data;
    this.runAuthPlugins(command, sock, session, username, password);
  }

  private async runAuthPlugins(command: SmtpCommand, sock: SmtpSocket, session: SmtpSession, username: string, password: string) {
    sock.data.authenticating = false; // Reset the authenticating flag
    const pluginResponse = await this.plugins?.executeAuthHooks(session, username, password);
    if (pluginResponse && pluginResponse instanceof AuthAccept) session.isAuthenticated = true; // Set authenticated flag if plugin accepts
    this.respond(sock, pluginResponse || SmtpResponse.Auth.reject()); // Return negative response if no plugins have anything to say
  }

  private async handleMailFromCommand(command: SmtpCommand, sock: SmtpSocket, session: SmtpSession) {
    if (session.phase !== 'helo' && session.phase !== 'auth') {
      this.respond(sock, new SmtpResponseAny(503, '5.5.1 Bad sequence of commands'));
      return;
    }

    if (command.parameters.length) {
      if (session.greetingType === 'HELO' && command.parameters.length > 1) {
        this.respond(sock, new SmtpResponseAny(500, '5.5.1 Command unrecognized: extended parameters not allowed')); // HELO only supports a single parameter
        return;
      }
      const email = new EnvelopeAddress(command.parameters[0]);
      if (email.address) {
        session.sender = email;
        session.phase = 'sender';
        const pluginResponse = await this.plugins?.executeMailFromHooks(session, email, command);
        this.respond(sock, pluginResponse || SmtpResponse.MailFrom.accept());
      } else {
        this.respond(sock, new SmtpResponseAny(501, '5.5.4 Syntax error in parameters or arguments')); // Invalid email address
      }
    } else {
      this.respond(sock, new SmtpResponseAny(501, '5.5.4 Syntax error in parameters or arguments'));
    }
  }

  private async handleRcptToCommand(command: SmtpCommand, sock: SmtpSocket, session: SmtpSession) {
    if (session?.phase !== 'sender' && session?.phase !== 'recipient') {
      this.respond(sock, new SmtpResponseAny(503, '5.5.1 Bad sequence of commands'));
      return;
    }

    if (command.parameters.length) {
      if (session.greetingType === 'HELO' && command.parameters.length > 1) {
        this.respond(sock, new SmtpResponseAny(500, '5.5.1 Command unrecognized: extended parameters not allowed')); // HELO only supports a single parameter
        return;
      }
      const email = new EnvelopeAddress(command.parameters[0]);
      if (email.address) {
        session.recipients.push(email);
        session.phase = 'recipient';
        const pluginResponse = await this.plugins?.executeRcptToHooks(session, email, command);
        this.respond(sock, pluginResponse || SmtpResponse.RcptTo.reject()); // RCPT TO phase REQUIRES plugin to accept
      } else {
        this.respond(sock, new SmtpResponseAny(501, '5.5.4 Syntax error in parameters or arguments')); // Invalid email address
      }
    } else {
      this.respond(sock, new SmtpResponseAny(501, '5.5.4 Syntax error in parameters or arguments'));
    }
  }

  // Handle the DATA command
  private async handleDataCommand(sock: SmtpSocket, session: SmtpSession) {
    if (session.phase !== 'recipient') {
      this.respond(sock, new SmtpResponseAny(503, '5.5.1 Bad sequence of commands'));
      return;
    }

    session.phase = 'data';
    session.isDataMode = true; // Enter DATA mode
    sock.data.onDataBufferEvent = new EventEmitter();
    this.plugins?.registerDataHooks(sock.data.onDataBufferEvent);

    const pluginResponse = await this.plugins?.executeDataStartHooks(session);
    this.respond(sock, pluginResponse || SmtpResponse.DataStart.accept());
  }

  // Handle incoming data stream
  private async handleData(sock: SmtpSocket, session: SmtpSession, data: Buffer) {
    sock.data.onDataBufferEvent?.emit('data', session, data);
    // Check if the data ends with single dot '\r\n.\r\n'.
    // We do this by keeping track of the last 5 characters of the last 5 chunks of data
    // This enables telnet-style connections to send a \r, \n, ., \r, \n
    sock.data.lastDataChunks.push(data.toString().slice(-5));
    if (sock.data.lastDataChunks.length > 5) sock.data.lastDataChunks.shift();
    if (sock.data.lastDataChunks.join('').match(/\r\n.\r\n$/)) {
      this.handleDataEnd(sock, session);
    }
  }

  // Handle the end of the data stream
  private async handleDataEnd(sock: SmtpSocket, session: SmtpSession) {
    sock.data.onDataBufferEvent?.emit('end', session);
    sock.data.onDataBufferEvent?.removeAllListeners();
    sock.data.onDataBufferEvent = null;
    session.isDataMode = false; // Exit DATA mode
    session.phase = 'postdata';
    const pluginResponse = await this.plugins?.executeDataEndHooks(session);
    this.respond(sock, pluginResponse || SmtpResponse.DataEnd.accept());
  }

  private async handleQuitCommand(sock: SmtpSocket, session: SmtpSession) {
    const pluginResponse = await this.plugins?.executeQuitHooks(session);
    this.respond(sock, pluginResponse || SmtpResponse.Quit.accept(), true);
  }

  private async handleRsetCommand(sock: SmtpSocket, session: SmtpSession) {
    const pluginResponse = await this.plugins?.executeRsetHooks(session);
    // Only reset session if we're past the connection phase - otherwise there's nothing to reset
    if (session.phase !== 'connection' && (!pluginResponse || pluginResponse instanceof RsetAccept)) {
      this.resetSession(sock, sock.data.id, 'helo', session); // Reset the session state, AFTER the HELO phase
      // TODO - if we store HELO/EHLO data, we need to NOT reset that
    }
    this.respond(sock, pluginResponse || SmtpResponse.Rset.accept());
  }

  private async handleHelpCommand(sock: SmtpSocket, session: SmtpSession) {
    const pluginResponse = await this.plugins?.executeHelpHooks(session);
    this.respond(sock, pluginResponse || SmtpResponse.Help.accept());
  }

  private async handleNoopCommand(sock: SmtpSocket, session: SmtpSession) {
    const pluginResponse = await this.plugins?.executeNoopHooks(session);
    this.respond(sock, pluginResponse || SmtpResponse.Noop.accept());
  }

  private async handleVrfyCommand(command: SmtpCommand, sock: SmtpSocket, session: SmtpSession) {
    const pluginResponse = await this.plugins?.executeVrfyHooks(session, command); // Pass raw command instead of an EnvelopeAddress to plugins since VRFY data can get weird
    this.respond(sock, pluginResponse || SmtpResponse.Vrfy.accept());
  }

  private async handleUnknownCommand(command: SmtpCommand, sock: SmtpSocket, session: SmtpSession) {
    const pluginResponse = await this.plugins?.executeUnknownHooks(session, command);
    this.respond(sock, pluginResponse || SmtpResponse.Unknown.reject());
  }

  private resetTimeout(sock: SmtpSocket, clearOnly = false) {
    // Clear the existing timeout if set
    if (sock.data?.timeout) {
      clearTimeout(sock.data.timeout);
    }

    if (clearOnly) return; // Only clear the timeout, don't set a new one

    // Set a new timeout
    sock.data.timeout = setTimeout(() => {
      logger.debug(`Session ${sock.data.id} timed out due to inactivity.`); // TODO add more info about client (ip, etc.)
      this.respond(sock, new SmtpResponseAny(421, '4.4.2 Connection timed out due to inactivity'), true);
    }, 15000);
  }

  private respond(sock: SmtpSocket, response: SmtpResponseAny, end = false) {
    if (response.code === 421) end = true; // 421 should always terminate connection https://datatracker.ietf.org/doc/html/rfc5321#section-3.8
    this.write(sock, `${response.code} ${response.message}`, end);
  }

  private respondExtended(sock: SmtpSocket, response: SmtpResponseAny, extended: string[], end = false) {
    const lines = [response.message, ...extended];
    const messages = lines.map((line, i) => {
      if (i === lines.length - 1) return `${response.code} ${line}`;
      return `${response.code}-${line}`;
    });
    this.write(sock, messages.join('\r\n'), end);
  }

  private write(sock: SmtpSocket, message: string, end = false) {
    logger.smtp(`< ${message}`);
    sock.write(`${message}\r\n`);
    if (end) sock.end();
  }

  private async endSocket(sock: SmtpSocket) {
    // Trigger executeCloseHooks and clean up the session when the connection is closed
    if (sock.data?.id) {
      const session = sessions.get(sock.data.id);
      if (session) {
        await this.plugins?.executeCloseHooks(session);
        //TODO add remoteAddress to session and reinstate variable below:
        logger.debug(`Client [[remoteAddress]] disconnected. ${Date.now() - session.startTime}ms`); // TODO add more info about client (ip, etc.)
      }
      sessions.delete(sock.data.id);
    }
    if (sock.data?.timeout) {
      clearTimeout(sock.data.timeout);
    }
  }
}
