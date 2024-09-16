import { Socket } from 'net';
import { EventEmitter } from 'events';
import { EnvelopeAddress } from './EmailAddress';

// Data structure for the socket (an internal session store)
interface SocketData {
  id: number;
  timeout?: Timer | null;
  authenticating: boolean | string; // true or string of username during AUTH LOGIN process
  onDataBufferEvent?: EventEmitter | null; // Event emitter for incoming message data stream
  lastDataChunks: string[]; // The last 5 chunks of data received from DATA phase. Used to detect end of data.
}
export interface SmtpSocket extends Socket {
  data: SocketData;
}

type SmtpPhase = 'connection' | 'auth' | 'helo' | 'sender' | 'recipient' | 'data' | 'postdata';
export class SmtpSession {
  public id: number; // A unique identifier for the session
  public startTime: number; // The time the session started
  public remoteAddress: string | undefined; // The remote IP address of the client
  public phase: SmtpPhase; // The current phase of the SMTP session
  public greetingType: 'HELO' | 'EHLO' | null; // The greeting type used by the client
  public isSecure: boolean; // Whether the connection is secured via TLS or STARTTLS
  public isAuthenticated: boolean; // Whether the client has authenticated successfully
  public isDataMode: boolean;
  public sender: EnvelopeAddress | null;
  public recipients: EnvelopeAddress[];
  public pluginData: Record<string, Record<string, any>> = {};

  constructor(sock: SmtpSocket, phase: 'connection' | 'helo' = 'connection', session: SmtpSession | null = null) {
    this.id = sock.data.id;
    this.startTime = session?.startTime ? session.startTime : Date.now(); // Don't reset start time if we already have one
    this.remoteAddress = sock.remoteAddress; // Remote IP address of the client
    this.phase = phase; // Connection for new connections, helo for RSET
    this.greetingType = session?.greetingType ? session.greetingType : null;
    this.isSecure = session?.isSecure ? session.isSecure : false;
    this.isAuthenticated = session?.isAuthenticated ? session.isAuthenticated : false; // Once authenticated, a client cannot complete another AUTH command in the same session (https://datatracker.ietf.org/doc/html/rfc4954#section-4)
    this.isDataMode = false;
    this.sender = null;
    this.recipients = [];
  }
}

// A mostly read-only version of the SmtpSession class
// Plugins can store session data in their own namespace
export class SmtpPluginSession {
  private _id: number; // A unique identifier for the session
  private _startTime: number; // The time the session started
  private _remoteAddress: string | undefined; // The remote IP address of the client
  private _phase: SmtpPhase; // The current phase of the SMTP session
  public _greetingType: 'HELO' | 'EHLO' | null; // The greeting type used by the client
  private _isSecure: boolean; // Whether the connection is secured via TLS or STARTTLS
  private _isAuthenticated: boolean; // Whether the client has authenticated successfully
  private _isDataMode: boolean;
  private _sender: EnvelopeAddress | null = null;
  private _recipients: EnvelopeAddress[] = [];
  private _pluginName: string;
  private _pluginData: Record<string, Record<string, any>> = {};

  constructor(pluginName: string, session: SmtpSession) {
    this._id = session.id;
    this._startTime = session.startTime;
    this._remoteAddress = session.remoteAddress;
    this._phase = session.phase;
    this._greetingType = session.greetingType;
    this._isSecure = session.isSecure;
    this._isAuthenticated = session.isAuthenticated;
    this._isDataMode = session.isDataMode;
    this._sender = session.sender;
    this._recipients = session.recipients;
    this._pluginName = pluginName;
    this._pluginData = session.pluginData;
  }

  public get id(): number {
    return this._id;
  }

  public get startTime(): number {
    return this._startTime;
  }

  public get remoteAddress(): string | undefined {
    return this._remoteAddress;
  }

  public get phase(): SmtpPhase {
    return this._phase;
  }

  public get greetingType(): 'HELO' | 'EHLO' | null {
    return this._greetingType;
  }

  public get isSecure(): boolean {
    return this._isSecure;
  }

  public get isAuthenticated(): boolean {
    return this._isAuthenticated;
  }

  public get isDataMode(): boolean {
    return this._isDataMode;
  }

  public get sender(): EnvelopeAddress | null {
    return this._sender;
  }

  public get recipients(): EnvelopeAddress[] {
    return this._recipients;
  }

  // Method to read data set by other plugins
  public getPluginData(pluginName: string): Record<string, any> | undefined {
    return this._pluginData[pluginName];
  }

  // Method to read/write data for the specific plugin instance
  public getOwnPluginData(key: string): any {
    return this._pluginData[this._pluginName]?.[key];
  }

  public setOwnPluginData(key: string, value: any): void {
    if (!this._pluginData[this._pluginName]) {
      this._pluginData[this._pluginName] = {}; // Initialize the plugin's data store if not present
    }
    this._pluginData[this._pluginName][key] = value;
  }
}
